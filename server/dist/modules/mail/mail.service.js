"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
const googleapis_1 = require("googleapis");
const stream_1 = require("stream");
const prisma_service_1 = require("../prisma/prisma.service");
let MailService = class MailService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    get oauth2Client() {
        const client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI || 'http://localhost:4000/mail/oauth2callback');
        if (process.env.GOOGLE_REFRESH_TOKEN) {
            client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
        }
        return client;
    }
    async getTransporter() {
        if (process.env.GOOGLE_CLIENT_ID &&
            process.env.GOOGLE_CLIENT_SECRET &&
            (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN)) {
            const oauth2Client = this.oauth2Client;
            if (process.env.GOOGLE_REFRESH_TOKEN) {
                const { token } = await oauth2Client.getAccessToken();
                if (token)
                    process.env.GOOGLE_ACCESS_TOKEN = token;
            }
            return nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: process.env.SMTP_USERNAME,
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                    accessToken: process.env.GOOGLE_ACCESS_TOKEN,
                },
                logger: true,
                debug: true,
            });
        }
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'ssl',
            auth: {
                user: process.env.SMTP_USERNAME,
                pass: process.env.SMTP_PASSWORD,
            },
            logger: true,
            debug: true,
        });
    }
    getDefaultRecipients() {
        return {
            supplier: process.env.SUPPLIER_TO || '',
            testing: process.env.TESTING_TO || '',
        };
    }
    async send(to, subject, html) {
        const toPlainText = (h) => {
            try {
                return (h || '')
                    .replace(/<style[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }
            catch {
                return '';
            }
        };
        const text = toPlainText(html);
        try {
            const htmlLen = typeof html === 'string' ? html.length : 0;
            const textLen = typeof text === 'string' ? text.length : 0;
            console.log(`[MailService] Sending mail to=${to} subject="${subject}" htmlLen=${htmlLen} textLen=${textLen}`);
            const transporter = await this.getTransporter();
            const result = await transporter.sendMail({
                from: {
                    name: process.env.FROM_NAME || 'Defekt Report System',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '',
                },
                to,
                subject,
                html,
                text,
                headers: { 'X-Mailer': 'Defekt-Report' },
                textEncoding: 'quoted-printable',
            });
            await this.prisma.emailLog.create({
                data: { to, subject, status: 'SENT' },
            });
            return result;
        }
        catch (err) {
            await this.prisma.emailLog.create({
                data: { to, subject, status: 'ERROR', error: String((err === null || err === void 0 ? void 0 : err.message) || err) },
            });
            throw err;
        }
    }
    generateGoogleAuthUrl() {
        const oauth2Client = this.oauth2Client;
        const scopes = [
            'https://mail.google.com/',
            'https://www.googleapis.com/auth/drive.file',
        ];
        return oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: scopes,
        });
    }
    async exchangeCodeForTokens(code) {
        const oauth2Client = this.oauth2Client;
        const { tokens } = await oauth2Client.getToken(code);
        return tokens;
    }
    async verifyTransport() {
        try {
            const usingOauth2 = Boolean(process.env.GOOGLE_CLIENT_ID &&
                process.env.GOOGLE_CLIENT_SECRET &&
                (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN));
            const transporter = await this.getTransporter();
            await transporter.verify();
            return {
                ok: true,
                message: 'Transport verified',
                method: usingOauth2 ? 'oauth2' : 'smtp',
                user: process.env.SMTP_USERNAME || '',
                details: {
                    hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
                    hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
                    hasRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
                    hasAccessToken: Boolean(process.env.GOOGLE_ACCESS_TOKEN),
                },
            };
        }
        catch (e) {
            const usingOauth2 = Boolean(process.env.GOOGLE_CLIENT_ID &&
                process.env.GOOGLE_CLIENT_SECRET &&
                (process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_ACCESS_TOKEN));
            return {
                ok: false,
                method: usingOauth2 ? 'oauth2' : 'smtp',
                user: process.env.SMTP_USERNAME || '',
                details: {
                    hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
                    hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
                    hasRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
                    hasAccessToken: Boolean(process.env.GOOGLE_ACCESS_TOKEN),
                },
                error: String((e === null || e === void 0 ? void 0 : e.message) || e),
            };
        }
    }
    getDriveClient() {
        const oauth2Client = this.oauth2Client;
        return googleapis_1.google.drive({ version: 'v3', auth: oauth2Client });
    }
    async createDriveFolder(name, parentId) {
        const drive = this.getDriveClient();
        const fileMetadata = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
        };
        if (parentId)
            fileMetadata.parents = [parentId];
        const res = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id, webViewLink',
        });
        return res.data;
    }
    async uploadHtmlToFolder(folderId, filename, html) {
        const drive = this.getDriveClient();
        const media = {
            mimeType: 'text/html',
            body: stream_1.Readable.from(Buffer.from(html || '', 'utf8')),
        };
        const requestBody = {
            name: filename,
            parents: [folderId],
        };
        const res = await drive.files.create({
            requestBody,
            media,
            fields: 'id, webViewLink',
        });
        return res.data;
    }
    async saveReportsToDrive(supplierHtml, customerHtml, folderName) {
        const parentId = process.env.DRIVE_PARENT_FOLDER_ID || undefined;
        const folder = await this.createDriveFolder(folderName, parentId);
        await this.uploadHtmlToFolder(folder.id, 'defekt_report_supplier.html', supplierHtml || '');
        await this.uploadHtmlToFolder(folder.id, 'defekt_report_customer.html', customerHtml || '');
        return folder;
    }
    async saveAttachmentsToDrive(folderId, attachments) {
        const drive = this.getDriveClient();
        for (const att of attachments || []) {
            const media = {
                mimeType: att.contentType || 'application/octet-stream',
                body: stream_1.Readable.from(Buffer.from(att.content, 'base64')),
            };
            const requestBody = {
                name: att.filename || `file-${Date.now()}`,
                parents: [folderId],
            };
            await drive.files.create({ requestBody, media, fields: 'id' });
        }
    }
    async saveUploadedFilesToDrive(folderId, files) {
        const drive = this.getDriveClient();
        for (const file of files || []) {
            const media = {
                mimeType: file.mimetype || 'application/octet-stream',
                body: stream_1.Readable.from(file.buffer),
            };
            const requestBody = {
                name: file.originalname || `file-${Date.now()}`,
                parents: [folderId],
            };
            await drive.files.create({ requestBody, media, fields: 'id' });
        }
    }
    async testSend(to) {
        const html = '<b>Test email from Defekt Report</b>';
        return this.send(to, 'SMTP/OAuth2 Test', html);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MailService);
//# sourceMappingURL=mail.service.js.map