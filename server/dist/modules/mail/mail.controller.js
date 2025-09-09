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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer = require("multer");
const class_validator_1 = require("class-validator");
const mail_service_1 = require("./mail.service");
class SendMailDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "supplierHtml", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "customerHtml", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "supplierRecipient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "customerRecipient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "testRecipient", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "submissionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SendMailDto.prototype, "ownerEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], SendMailDto.prototype, "attachments", void 0);
let MailController = class MailController {
    constructor(mail) {
        this.mail = mail;
    }
    async send(body) {
        const defaults = this.mail.getDefaultRecipients();
        const supplierTo = body.testRecipient || body.supplierRecipient || defaults.supplier;
        const customerTo = body.testRecipient || body.customerRecipient || defaults.testing;
        if (!supplierTo || !customerTo) {
            throw new common_1.HttpException('Missing recipients', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const senderEmail = body.customerRecipient || body.testRecipient || body.supplierRecipient || '';
            const now = new Date();
            const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
            const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
            const safeEmail = String(senderEmail || 'unknown').replace(/[^a-zA-Z0-9_.@+-]/g, '_');
            const idPart = body.submissionId || `${Date.now()}`;
            const folderName = `${safeEmail}-${ts}-${idPart}`;
            const folder = await this.mail.saveReportsToDrive(body.supplierHtml, body.customerHtml, folderName);
            if (Array.isArray(body.attachments) && body.attachments.length > 0) {
                await this.mail.saveAttachmentsToDrive(folder.id, body.attachments);
            }
            await this.mail.send(supplierTo, 'New Defekt Report - Supplier Details', body.supplierHtml);
            await this.mail.send(customerTo, 'Your Defekt Report Summary', body.customerHtml);
            const owner = body.ownerEmail || process.env.OWNER_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '';
            if (owner) {
                const link = folder.webViewLink || '';
                const recapHtml = `<!DOCTYPE html><html><body>
          <p>New Defekt Report submission.</p>
          <p>Folder: <a href="${link}" target="_blank" rel="noreferrer">${link}</a></p>
          <p>Supplier: ${supplierTo}<br/>Customer: ${customerTo}</p>
          <p>ID: ${body.submissionId || '-'}</p>
        </body></html>`;
                await this.mail.send(owner, 'Defekt Report - Submission Recap', recapHtml);
            }
            return { success: true, driveFolder: { id: folder.id, webViewLink: folder.webViewLink } };
        }
        catch (e) {
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'Send failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async sendMultipart(files, body) {
        const supplierHtml = body.supplierHtml || '';
        const customerHtml = body.customerHtml || '';
        const submissionId = body.submissionId || `${Date.now()}`;
        const owner = body.ownerEmail || process.env.OWNER_EMAIL || process.env.FROM_EMAIL || process.env.SMTP_USERNAME || '';
        const supplierTo = body.supplierRecipient || owner;
        const customerTo = body.customerRecipient || owner;
        if (!supplierTo || !customerTo) {
            throw new common_1.HttpException('Missing recipients', common_1.HttpStatus.BAD_REQUEST);
        }
        try {
            const senderEmail = customerTo || supplierTo || '';
            const now = new Date();
            const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
            const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
            const safeEmail = String(senderEmail || 'unknown').replace(/[^a-zA-Z0-9_.@+-]/g, '_');
            const folderName = `${safeEmail}-${ts}-${submissionId}`;
            const folder = await this.mail.saveReportsToDrive(supplierHtml, customerHtml, folderName);
            if (Array.isArray(files) && files.length > 0) {
                console.log('[send-multipart] received files:', files.map(f => ({ name: f.originalname, size: f.size, mimetype: f.mimetype })));
                await this.mail.saveUploadedFilesToDrive(folder.id, files);
            }
            else {
                console.log('[send-multipart] no files received');
            }
            await this.mail.send(supplierTo, 'New Defekt Report - Supplier Details', supplierHtml);
            await this.mail.send(customerTo, 'Your Defekt Report Summary', customerHtml);
            if (owner) {
                const link = folder.webViewLink || '';
                const recapHtml = `<!DOCTYPE html><html><body>
          <p>New Defekt Report submission.</p>
          <p>Folder: <a href="${link}" target="_blank" rel="noreferrer">${link}</a></p>
          <p>Supplier: ${supplierTo}<br/>Customer: ${customerTo}</p>
          <p>ID: ${submissionId}</p>
        </body></html>`;
                await this.mail.send(owner, 'Defekt Report - Submission Recap', recapHtml);
            }
            return { success: true, driveFolder: { id: folder.id, webViewLink: folder.webViewLink } };
        }
        catch (e) {
            throw new common_1.HttpException((e === null || e === void 0 ? void 0 : e.message) || 'Send failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async auth(res) {
        const url = this.mail.generateGoogleAuthUrl();
        return res.redirect(url);
    }
    async oauthCallback(code) {
        if (!code) {
            throw new common_1.HttpException('Missing code', common_1.HttpStatus.BAD_REQUEST);
        }
        const tokens = await this.mail.exchangeCodeForTokens(code);
        return { success: true, tokens };
    }
    async verify() {
        return this.mail.verifyTransport();
    }
    async test(to) {
        if (!to) {
            throw new common_1.HttpException('Missing "to"', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.mail.testSend(to);
        return { ok: true };
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SendMailDto]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "send", null);
__decorate([
    (0, common_1.Post)('send-multipart'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 30, { storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "sendMultipart", null);
__decorate([
    (0, common_1.Get)('auth'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "auth", null);
__decorate([
    (0, common_1.Get)('oauth2callback'),
    __param(0, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "oauthCallback", null);
__decorate([
    (0, common_1.Get)('verify'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MailController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "test", null);
exports.MailController = MailController = __decorate([
    (0, common_1.Controller)('mail'),
    __metadata("design:paramtypes", [mail_service_1.MailService])
], MailController);
//# sourceMappingURL=mail.controller.js.map