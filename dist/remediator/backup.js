import fs from 'fs';
import path from 'path';
export class BackupManager {
    /**
     * Create an atomic, timestamped backup of a file before modification
     */
    static createBackup(filePath, customBackupDir) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Cannot backup non-existent file: ${filePath}`);
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = path.basename(filePath);
        const backupDir = customBackupDir || path.dirname(filePath);
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        const backupPath = path.join(backupDir, `${fileName}.bak.${timestamp}`);
        fs.copyFileSync(filePath, backupPath);
        return backupPath;
    }
    /**
     * Restore a file from a backup
     */
    static restore(backupPath, targetPath) {
        if (!fs.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        fs.copyFileSync(backupPath, targetPath);
    }
}
//# sourceMappingURL=backup.js.map