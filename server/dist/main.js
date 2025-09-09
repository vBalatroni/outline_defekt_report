"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./modules/app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true, credentials: true });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`API listening on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map