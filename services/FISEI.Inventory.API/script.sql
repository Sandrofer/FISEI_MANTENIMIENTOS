IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526041904_InitialMigration'
)
BEGIN
    CREATE TABLE [Equipos] (
        [Id] int NOT NULL IDENTITY,
        [NumeroSerie] nvarchar(max) NOT NULL,
        [Marca] nvarchar(100) NOT NULL,
        [Modelo] nvarchar(100) NOT NULL,
        [Procesador] nvarchar(150) NOT NULL,
        [Laboratorio] nvarchar(100) NOT NULL,
        [FechaCompra] date NOT NULL,
        [Estado] nvarchar(50) NOT NULL,
        [FechaRegistro] datetime2 NOT NULL,
        [Eliminado] bit NOT NULL,
        CONSTRAINT [PK_Equipos] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526041904_InitialMigration'
)
BEGIN
    CREATE TABLE [Mantenimientos] (
        [Id] int NOT NULL IDENTITY,
        [EquipoId] int NOT NULL,
        [FechaProgramada] date NOT NULL,
        [Estado] nvarchar(50) NOT NULL,
        [Observaciones] nvarchar(500) NULL,
        CONSTRAINT [PK_Mantenimientos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Mantenimientos_Equipos_EquipoId] FOREIGN KEY ([EquipoId]) REFERENCES [Equipos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526041904_InitialMigration'
)
BEGIN
    CREATE INDEX [IX_Mantenimientos_EquipoId] ON [Mantenimientos] ([EquipoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260526041904_InitialMigration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260526041904_InitialMigration', N'10.0.8');
END;

COMMIT;
GO

