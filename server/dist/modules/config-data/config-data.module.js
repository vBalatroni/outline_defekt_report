"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigDataModule = void 0;
const common_1 = require("@nestjs/common");
const config_data_service_1 = require("./config-data.service");
const config_data_controller_1 = require("./config-data.controller");
let ConfigDataModule = class ConfigDataModule {
};
exports.ConfigDataModule = ConfigDataModule;
exports.ConfigDataModule = ConfigDataModule = __decorate([
    (0, common_1.Module)({
        providers: [config_data_service_1.ConfigDataService],
        controllers: [config_data_controller_1.ConfigDataController],
    })
], ConfigDataModule);
//# sourceMappingURL=config-data.module.js.map