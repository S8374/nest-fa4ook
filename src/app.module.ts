import {
  BadRequestException,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ContextModule } from './common/context/context.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ResponseStandardizationInterceptor } from './common/interceptors/response-standardization.interceptor';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { PropertyModule } from './modules/property/property.module';
import { PropertyAttributeModule } from './modules/property-attribute/property-attribute.module';
import { DeveloperModule } from './modules/developer/developer.module';
import { UnitModule } from './modules/unit/unit.module';
import { MediaModule } from './modules/media/media.module';
import { PaymentPlanModule } from './modules/paymentplan/paymentplan.module';
import { MilestoneModule } from './modules/milestone/milestone.module';
import { MilestonePaymentModule } from './modules/mileston-payment/mileston-payment.module';


@Module({
  imports: [ContextModule, ConfigModule.forRoot(), MilestonePaymentModule, MailModule, AuthModule, PropertyModule, PropertyAttributeModule, DeveloperModule, UnitModule, MediaModule, PaymentPlanModule, MilestoneModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseStandardizationInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: false,               // allow Zod DTO

        transform: true,
        forbidNonWhitelisted: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          return new BadRequestException(errors);
        },
      }),
    },
    Reflector,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*path');
  }
}
