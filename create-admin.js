// Script para crear el usuario administrador principal
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
    const email = 'ezequielbanega@gmail.com';
    const password = 'Cerberus456852!';
    const name = 'Ezequiel';

    try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('El usuario ya existe. Actualizando...');
            const passwordHash = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { email },
                data: {
                    name,
                    passwordHash,
                    isActive: true,
                    isAdmin: true
                }
            });
            console.log('✅ Usuario actualizado correctamente');
        } else {
            console.log('Creando nuevo usuario administrador...');
            const passwordHash = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: {
                    email,
                    name,
                    passwordHash,
                    isActive: true,
                    isAdmin: true
                }
            });
            console.log('✅ Usuario administrador creado correctamente');
        }

        console.log('\nCredenciales:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('Nombre:', name);
        console.log('Admin:', true);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
