export interface JwtPayloadModel {
    sub: string;
    role: string;
    exp: number;
}