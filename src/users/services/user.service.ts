
import type { HydratedDocument } from 'mongoose';
import User, { IUser } from '../../models/user.model';
import emailService from './email.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import Receita from '../../receitas/models/receita.model';
import Despesa from '../../despesas/models/despesa.model';

interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  user: {
    id: string;
    name: string;
    email: string;
  };
  token: string;
}

interface ServiceResponse {
  message: string;
}

export class ServiceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

class UserService {

  async createUser(
    userData: CreateUserData
  ): Promise<HydratedDocument<IUser>> {

    const normalizedEmail = userData.email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      throw new ServiceError(
        'Este e-mail já está cadastrado.',
        409
      );
    }

    const hashedPassword = await bcrypt.hash(
      userData.password,
      10
    );

    const user = await User.create({
      ...userData,
      email: normalizedEmail,
      password: hashedPassword
    });

    return user;
  }

  async login(
    credentials: LoginCredentials
  ): Promise<LoginResult> {

    const user = await User.findOne({
      email: credentials.email.trim().toLowerCase()
    });

    if (!user) {
      throw new ServiceError(
        'Email ou senha inválidos.',
        401
      );
    }

    const passwordIsValid = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!passwordIsValid) {
      throw new ServiceError(
        'Email ou senha inválidos.',
        401
      );
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new ServiceError(
        'JWT_SECRET não configurada.',
        500
      );
    }

    const signOptions: jwt.SignOptions = {
      expiresIn: '1d'
    };

    const token = jwt.sign(
      { id: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
      jwtSecret,
      signOptions
    );

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      },
      token
    };
  }

  async requestPasswordReset(
    email: string
  ): Promise<ServiceResponse> {

    if (!email || typeof email !== 'string') {
      throw new ServiceError(
        'Informe um e-mail válido.',
        400
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    });

    const successMessage: ServiceResponse = {
      message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.'
    };

    if (!user) {
      return successMessage;
    }

    if (!process.env.FRONTEND_URL) {
      throw new ServiceError(
        'FRONTEND_URL não configurada.',
        500
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const resetLink =
      `${process.env.FRONTEND_URL}/redefinir-senha?token=${resetToken}`;

    try {

      await emailService.sendEmail({
        to: user.email,
        subject: 'Recuperação de senha - MyExpenses',
        html: `
          <h2>Recuperação de senha</h2>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p>Este link é válido por 15 minutos.</p>
          <a href="${resetLink}">Redefinir minha senha</a>
        `
      });

    } catch (error: unknown) {

      const errorMessage = error instanceof Error
        ? error.message
        : String(error);

      console.error(
        'Erro ao enviar e-mail de recuperação:',
        errorMessage
      );

      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      throw error;
    }

    return successMessage;
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<ServiceResponse> {

    if (
      !token ||
      typeof token !== 'string' ||
      !password ||
      typeof password !== 'string'
    ) {
      throw new ServiceError(
        'Token e senha são obrigatórios.',
        400
      );
    }

    if (password.length < 6) {
      throw new ServiceError(
        'A senha deve ter pelo menos 6 caracteres.',
        400
      );
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date()
      }
    });

    if (!user) {
      throw new ServiceError(
        'Token inválido ou expirado.',
        400
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return {
      message: 'Senha redefinida com sucesso!'
    };
  }

  async getUserById(
    userId: string
  ): Promise<HydratedDocument<IUser>> {

    const user = await User.findById(userId);

    if (!user) {
      throw new ServiceError(
        'Usuário não encontrado.',
        404
      );
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: { name: string; email: string; currentPassword: string }
  ): Promise<{ name: string; email: string }> {
    const name = typeof data?.name === 'string' ? data.name.trim() : '';
    const email = typeof data?.email === 'string' ? data.email.trim().toLowerCase() : '';
    const currentPassword = typeof data?.currentPassword === 'string' ? data.currentPassword : '';

    if (!name || name.length > 100) {
      throw new ServiceError('Informe um nome válido com até 100 caracteres.', 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ServiceError('Informe um e-mail válido.', 400);
    }

    if (!currentPassword) {
      throw new ServiceError('Informe sua senha atual para confirmar as alterações.', 400);
    }

    const user = await this.getUserById(userId);
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new ServiceError('Senha atual incorreta.', 401);
    }

    const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
    if (existingUser) {
      throw new ServiceError('Este e-mail já está em uso.', 409);
    }

    user.name = name;
    user.email = email;
    await user.save();

    return { name: user.name, email: user.email };
  }

  async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
  ): Promise<ServiceResponse> {
    const currentPassword = typeof data?.currentPassword === 'string' ? data.currentPassword : '';
    const newPassword = typeof data?.newPassword === 'string' ? data.newPassword : '';
    if (typeof currentPassword !== 'string' || !currentPassword ||
        typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new ServiceError('Informe a senha atual e uma nova senha com pelo menos 6 caracteres.', 400);
    }

    if (currentPassword === newPassword) {
      throw new ServiceError('A nova senha deve ser diferente da senha atual.', 400);
    }

    const user = await this.getUserById(userId);
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new ServiceError('Senha atual incorreta.', 401);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return { message: 'Senha alterada com sucesso. Entre novamente com a nova senha.' };
  }

  async deleteAccount(userId: string, currentPassword: string): Promise<void> {
    if (typeof currentPassword !== 'string' || !currentPassword) {
      throw new ServiceError('Informe sua senha atual para excluir a conta.', 400);
    }

    const user = await this.getUserById(userId);
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new ServiceError('Senha atual incorreta.', 401);
    }

    await Promise.all([
      Receita.deleteMany({ userId: user._id }),
      Despesa.deleteMany({ userId: user._id })
    ]);
    await User.deleteOne({ _id: user._id });
  }
}

export default new UserService();
