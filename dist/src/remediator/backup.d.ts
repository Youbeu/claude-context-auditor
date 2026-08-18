export declare class BackupManager {
    /**
     * Create an atomic, timestamped backup of a file before modification
     */
    static createBackup(filePath: string, customBackupDir?: string): string;
    /**
     * Restore a file from a backup
     */
    static restore(backupPath: string, targetPath: string): void;
}
//# sourceMappingURL=backup.d.ts.map