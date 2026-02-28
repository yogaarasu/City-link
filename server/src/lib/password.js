import bcryptjs from 'bcryptjs';

export const hash = async (password) => {
    const salt = await bcryptjs.genSalt(10);
    return await bcryptjs.hash(password, salt);
}

export const compare = async (password, hashedPassword) => {
    return await bcryptjs.compare(password, hashedPassword);
}