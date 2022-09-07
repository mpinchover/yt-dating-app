import { injectable } from "tsyringe";

export interface FirebaseControllerParams {
  auth: any;
}

@injectable()
export class FirebaseController {
  auth: any;
  constructor() {}

  updatePassword = async (params: updatePasswordParams) => {
    const { userId, password, confirmPassword } = params;
    updatePasswordParams(params);
    await this.auth.updateUser(userId, {
      password,
    });
  };

  updateEmail = async (params: updateEmailParams) => {
    const { userId, email } = params;
    updateEmailParams(params);
    await this.auth.updateUser(userId, {
      email,
    });
  };

  updateMobile = async (params: updateMobileParams) => {
    const { userId, mobile } = params;
    updateMobileParams(params);
    await this.auth.updateUser(userId, {
      mobile,
    });
  };
}

export const updatePasswordParams = (params: updatePasswordParams) => {
  const { userId, password, confirmPassword } = params;
  if (!userId) throw new Error("user id cannot be null for update password");
  if (!password) throw new Error("password cannot be null for update password");
  if (!confirmPassword)
    throw new Error("confirm password cannot be null for update password");
  if (password !== confirmPassword) throw new Error("passwords don't match");
};

export const updateEmailParams = (params: updateEmailParams) => {
  const { userId, email } = params;
  if (!userId) throw new Error("user id cannot be null for update email");
  if (!email) throw new Error("email cannot be null for update email");
};

export const updateMobileParams = (params: updateMobileParams) => {
  const { userId, mobile } = params;
  if (!userId) throw new Error("user id cannot be null for update email");
  if (!mobile) throw new Error("email cannot be null for update email");
};

export interface updatePasswordParams {
  userId: string;
  password: string;
  confirmPassword: string;
}

export interface updateEmailParams {
  userId: string;
  email: string;
}

export interface updateMobileParams {
  userId: string;
  mobile: string;
}
