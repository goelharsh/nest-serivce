import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthController } from "apps/auth-service/src/auth.controller";
import { AuthModule } from "apps/auth-service/src/auth.module";
import { AuthService } from "apps/auth-service/src/auth.service";
import 'dotenv/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `./config/${process.env.NODE_ENV || "development"}.env`,
    }),
    AuthModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AppModule {}

