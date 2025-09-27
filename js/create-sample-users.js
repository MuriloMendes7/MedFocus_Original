// Script to create sample users for testing
const sampleUsers = [
    {
        id: 'user1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        plan: 'premium',
        role: 'student',
        isActive: true,
        createdAt: '2024-01-15T10:00:00.000Z',
        lastLoginAt: '2024-01-20T14:30:00.000Z',
        phone: '+55 11 99999-9999'
    },
    {
        id: 'user2',
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        plan: 'basic',
        role: 'student',
        isActive: true,
        createdAt: '2024-01-10T09:15:00.000Z',
        lastLoginAt: '2024-01-19T16:45:00.000Z',
        phone: '+55 21 88888-8888'
    },
    {
        id: 'user3',
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        plan: 'free',
        role: 'student',
        isActive: false,
        createdAt: '2024-01-05T11:30:00.000Z',
        lastLoginAt: null,
        phone: '+55 85 77777-7777'
    },
    {
        id: 'user4',
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        plan: 'basic',
        role: 'student',
        isActive: true,
        createdAt: '2024-01-12T14:20:00.000Z',
        lastLoginAt: '2024-01-18T11:10:00.000Z',
        phone: '+55 71 66666-6666'
    },
    {
        id: 'user5',
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@email.com',
        plan: 'premium',
        role: 'student',
        isActive: true,
        createdAt: '2024-01-08T16:45:00.000Z',
        lastLoginAt: '2024-01-21T09:30:00.000Z',
        phone: '+55 51 55555-5555'
    }
];

// Save to localStorage
localStorage.setItem('medFocusUsers', JSON.stringify(sampleUsers));

console.log('Sample users created successfully!');
console.log('Users:', sampleUsers);
