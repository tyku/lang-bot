import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BroadcastAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    // Получаем логин и пароль из конфигурации
    const adminLogin = this.configService.get<string>('broadcast.adminLogin');
    const adminPassword = this.configService.get<string>(
      'broadcast.adminPassword',
    );

    if (!adminLogin || !adminPassword) {
      throw new UnauthorizedException(
        'Broadcast admin credentials not configured',
      );
    }

    // Декодируем Base64
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString(
      'ascii',
    );
    const [username, password] = credentials.split(':');


    console.log("----------------", username, password, adminLogin, adminPassword);
    // Проверяем учетные данные
    if (username === adminLogin && password === adminPassword) {
      return true;
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}

