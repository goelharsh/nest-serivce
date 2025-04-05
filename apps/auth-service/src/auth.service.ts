import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IClient } from './schemas/client.schema';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('Client') private clientModel: Model<IClient>,
    private jwtService: JwtService,
  ) {}

  async validateClient(email: string, password: string): Promise<IClient> {
    const client = await this.clientModel.findOne({ defaultEmail: email.toLowerCase() });
    if (!client) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await client.comparePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return client;
  }

  async login(loginDto: LoginDto) {
    const client = await this.validateClient(loginDto.email, loginDto.password);
    
    // Update last login
    await this.clientModel.findByIdAndUpdate(client._id, {
      lastLoginAt: new Date(),
    });

    const payload = { 
      sub: client._id,
      email: client.defaultEmail,
    };

    return {
      access_token: this.jwtService.sign(payload),
      client: {
        id: client._id,
        email: client.defaultEmail,
        firstName: client.firstName,
        lastName: client.lastName,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingClient = await this.clientModel.findOne({
      defaultEmail: registerDto.email.toLowerCase(),
    });

    if (existingClient) {
      throw new UnauthorizedException('Email already exists');
    }

    const client = await this.clientModel.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      emailAddresses: [registerDto.email],
      defaultEmail: registerDto.email,
      password: registerDto.password,
    });

    const payload = {
      sub: client._id,
      email: client.defaultEmail,
    };

    return {
      access_token: this.jwtService.sign(payload),
      client: {
        id: client._id,
        email: client.defaultEmail,
        firstName: client.firstName,
        lastName: client.lastName,
      },
    };
  }
}