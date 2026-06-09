import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Equipo, Mantenimiento } from '../services/inventarioService';

export const generarReporteHojaVida = (
  equipo: Equipo,
  mantenimientos: Mantenimiento[],
  usuariosMap: Record<string, string>
) => {
  const doc = new jsPDF();
  
  // ==========================================
  // ESTILOS GENERALES
  // ==========================================
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let currentY = 20;

  // Helpers de fecha
  const formatearFechaHora = (fechaString: string | null) => {
    if (!fechaString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric', month: 'long', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }).format(new Date(fechaString));
    } catch {
      return fechaString;
    }
  };

  const formatearFecha = (fechaString: string | null) => {
    if (!fechaString) return 'N/A';
    try {
      return new Intl.DateTimeFormat('es-EC', {
        year: 'numeric', month: 'long', day: '2-digit'
      }).format(new Date(`${fechaString}T00:00:00`));
    } catch {
      return fechaString;
    }
  };

  // ==========================================
  // CABECERA DEL REPORTE
  // ==========================================
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text('HOJA DE VIDA DE EQUIPO', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-EC')}`, pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 15;

  // ==========================================
  // TABLA DE DATOS DEL EQUIPO
  // ==========================================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('INFORMACIÓN DEL EQUIPO', margin, currentY);
  currentY += 5;

  const equipoData = [
    ['Código de Inventario:', equipo.codigoInventario || 'N/A'],
    ['Número de Serie:', equipo.numeroSerie || 'N/A'],
    ['Marca:', equipo.marca || 'N/A'],
    ['Modelo:', equipo.nombreModelo || 'N/A'],
    ['Ubicación / Laboratorio:', equipo.ubicacion || 'N/A'],
    ['Categoría:', equipo.categoria || 'N/A'],
    ['Estado Actual:', equipo.estado || 'N/A'],
    ['Fecha de Registro:', formatearFechaHora(equipo.fechaRegistro)]
  ];

  autoTable(doc, {
    startY: currentY,
    body: equipoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      textColor: [0, 0, 0],
      font: 'helvetica'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    },
    didDrawPage: (data) => {
      currentY = data.cursor ? data.cursor.y : currentY;
    }
  });

  currentY += 15;

  // ==========================================
  // TABLA DE MANTENIMIENTOS
  // ==========================================
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text('HISTORIAL DE MANTENIMIENTOS', margin, currentY);
  currentY += 5;

  if (!mantenimientos || mantenimientos.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text('No hay mantenimientos registrados para este equipo.', margin, currentY + 5);
  } else {
    // Transformar los mantenimientos a filas para la tabla
    const tablaMantenimientos = mantenimientos.map(m => {
      const tecnico = m.responsable ? (usuariosMap[m.responsable] || m.responsable) : 'N/A';
      const fechaInicio = formatearFechaHora(m.fechaInicio || m.fechaProgramada);
      const fechaCierre = m.fechaCierre ? formatearFechaHora(m.fechaCierre) : 'Pendiente';
      const actividades = m.accionesRealizadas ? m.accionesRealizadas.replace(/\n/g, ', ') : 'Ninguna registrada';
      
      return [
        m.codigoCaso || 'N/A',
        fechaInicio,
        fechaCierre,
        m.tipo || 'N/A',
        m.estado,
        tecnico,
        m.diagnostico || 'N/A',
        actividades
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Cód. Caso', 'Inicio', 'Cierre', 'Tipo', 'Estado', 'Técnico', 'Diagnóstico', 'Actividades']],
      body: tablaMantenimientos,
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240], // Gris claro
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center'
      },
      styles: {
        fontSize: 8,
        textColor: [0, 0, 0],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 18 },
        5: { cellWidth: 22 },
        6: { cellWidth: 28 },
        7: { cellWidth: 'auto' } // Actividades ocupa el resto
      }
    });
  }

  // ==========================================
  // DESCARGAR PDF
  // ==========================================
  const fileName = `HojaVida_${equipo.numeroSerie || equipo.codigoInventario}.pdf`;
  doc.save(fileName);
};
