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
exports.ConfigDataController = void 0;
const common_1 = require("@nestjs/common");
const config_data_service_1 = require("./config-data.service");
let ConfigDataController = class ConfigDataController {
    constructor(service) {
        this.service = service;
    }
    async getLatest() {
        const assembled = await this.service.assembleLatest();
        if (assembled)
            return { content: assembled };
        const fallback = await this.service.getLatest();
        return fallback || { content: null };
    }
    save(body) {
        return this.service.create(body);
    }
    async import(body) {
        if (!body || typeof body !== 'object') {
            throw new common_1.BadRequestException('Invalid payload');
        }
        if (!Array.isArray(body.categories) || !body.categoryModels || !body.modelFieldConfigs) {
            throw new common_1.BadRequestException('Missing required config sections');
        }
        return this.service.importFromJson(body);
    }
    importDefault() {
        return this.service.importDefaultFromFile();
    }
    async setEmail(body) {
        if (!body || typeof body !== 'object')
            throw new common_1.BadRequestException('Invalid payload');
        const { supplierRecipient, testingRecipient } = body;
        await this.service.setEmailConfig({ supplierRecipient, testingRecipient });
        return { ok: true };
    }
};
exports.ConfigDataController = ConfigDataController;
__decorate([
    (0, common_1.Get)('latest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigDataController.prototype, "getLatest", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ConfigDataController.prototype, "save", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConfigDataController.prototype, "import", null);
__decorate([
    (0, common_1.Post)('import-default'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ConfigDataController.prototype, "importDefault", null);
__decorate([
    (0, common_1.Post)('email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConfigDataController.prototype, "setEmail", null);
exports.ConfigDataController = ConfigDataController = __decorate([
    (0, common_1.Controller)('config'),
    __metadata("design:paramtypes", [config_data_service_1.ConfigDataService])
], ConfigDataController);
//# sourceMappingURL=config-data.controller.js.map