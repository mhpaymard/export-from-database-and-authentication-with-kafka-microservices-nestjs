import { Injectable, OnModuleInit } from '@nestjs/common';
import * as protobuf from 'protobufjs';
import { join } from 'path';

@Injectable()
export class ProtoService implements OnModuleInit {
  private authRoot: protobuf.Root;
  private exportRoot: protobuf.Root;

  // Auth message types
  public RegisterRequest: protobuf.Type;
  public RegisterResponse: protobuf.Type;
  public LoginRequest: protobuf.Type;
  public LoginResponse: protobuf.Type;
  public VerifyTokenRequest: protobuf.Type;
  public VerifyTokenResponse: protobuf.Type;

  // Export message types
  public ExportQueryRequest: protobuf.Type;
  public ExportQueryResponse: protobuf.Type;
  public SchemaRequest: protobuf.Type;
  public SchemaResponse: protobuf.Type;

  async onModuleInit() {
    const protoPath = join(__dirname, "..","..", 'protos');

    // Load auth.proto
    this.authRoot = await protobuf.load(join(protoPath, 'auth.proto'));
    this.RegisterRequest = this.authRoot.lookupType('auth.RegisterRequest');
    this.RegisterResponse = this.authRoot.lookupType('auth.RegisterResponse');
    this.LoginRequest = this.authRoot.lookupType('auth.LoginRequest');
    this.LoginResponse = this.authRoot.lookupType('auth.LoginResponse');
    this.VerifyTokenRequest = this.authRoot.lookupType('auth.VerifyTokenRequest');
    this.VerifyTokenResponse = this.authRoot.lookupType('auth.VerifyTokenResponse');

    // Load export.proto
    this.exportRoot = await protobuf.load(join(protoPath, 'export.proto'));
    this.ExportQueryRequest = this.exportRoot.lookupType('export.ExportQueryRequest');
    this.ExportQueryResponse = this.exportRoot.lookupType('export.ExportQueryResponse');
    this.SchemaRequest = this.exportRoot.lookupType('export.SchemaRequest');
    this.SchemaResponse = this.exportRoot.lookupType('export.SchemaResponse');

    console.log('ProtoService initialized - Auth Service');
  }

  /**
   * Encode a message to protobuf binary format
   */
  encode(messageType: protobuf.Type, payload: any): Buffer {
    const errMsg = messageType.verify(payload);
    if (errMsg) {
      throw new Error(`Protobuf validation error: ${errMsg}`);
    }
    const message = messageType.create(payload);
    return Buffer.from(messageType.encode(message).finish());
  }

  /**
   * Decode a protobuf binary message
   */
  decode<T>(messageType: protobuf.Type, buffer: Buffer): T {
    const message = messageType.decode(buffer);
    return messageType.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
      defaults: true,
      arrays: true,
      objects: true,
    }) as T;
  }
}
