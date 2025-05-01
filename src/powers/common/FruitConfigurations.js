/**
 * Configuration settings for all fruit types
 */

export const fruitConfigurations = {
    flame: {
        name: 'Flame Fruit',
        type: 'flame',
        power: 40,
        attacks: ['Fireball', 'Flame Wave', 'Inferno'],
        specialProperties: {
            burnDuration: 3, // seconds
            burnDamage: 2    // damage per second
        },
        colors: {
            primary: 0xff5500,
            secondary: 0xff3300,
            ultimate: 0xff0000
        },
        attackSettings: {
            'Basic Attack': {
                name: 'Fireball',
                range: 3,
                speed: 15,
                lifetime: 1.5
            },
            'Special Attack': {
                name: 'Flame Wave',
                radius: 5,
                lifetime: 1.5,
                opacity: 0.7
            },
            'Ultimate Attack': {
                name: 'Inferno',
                radius: 8,
                lifetime: 3,
                opacity: 0.8
            }
        }
    },
    
    ice: {
        name: 'Ice Fruit',
        type: 'ice',
        power: 35,
        attacks: ['Ice Spike', 'Ice Wall', 'Blizzard'],
        specialProperties: {
            freezeDuration: 2,  // seconds
            slowEffect: 0.5     // 50% speed reduction
        },
        colors: {
            primary: 0x00ccff,
            secondary: 0x66ddff,
            ultimate: 0x99eeff
        },
        attackSettings: {
            'Basic Attack': {
                name: 'Ice Spike',
                range: 3,
                speed: 12,
                lifetime: 1.5
            },
            'Special Attack': {
                name: 'Ice Wall',
                radius: 4,
                lifetime: 2,
                opacity: 0.5
            },
            'Ultimate Attack': {
                name: 'Blizzard',
                radius: 8,
                lifetime: 2.5,
                opacity: 0.6
            }
        }
    },
    
    bomb: {
        name: 'Bomb Fruit',
        type: 'bomb',
        power: 45,
        attacks: ['Bomb Toss', 'Mine Field', 'Mega Explosion'],
        specialProperties: {
            explosionRadius: 4,
            knockback: 5
        },
        colors: {
            primary: 0x777700,
            secondary: 0x999900,
            ultimate: 0xbbbb00
        },
        attackSettings: {
            'Basic Attack': {
                name: 'Bomb Toss',
                range: 4,
                speed: 10,
                lifetime: 1
            },
            'Special Attack': {
                name: 'Mine Field',
                radius: 6,
                lifetime: 3,
                opacity: 0.6
            },
            'Ultimate Attack': {
                name: 'Mega Explosion',
                radius: 10,
                lifetime: 2,
                opacity: 0.9
            }
        }
    },
    
    light: {
        name: 'Light Fruit',
        type: 'light',
        power: 32,
        attacks: ['Light Beam', 'Flash Step', 'Solar Flare'],
        specialProperties: {
            blindDuration: 2,
            speedBoost: 1.5
        },
        colors: {
            primary: 0xffffaa,
            secondary: 0xffeeaa,
            ultimate: 0xffffff
        },
        attackSettings: {
            'Basic Attack': {
                name: 'Light Beam',
                range: 5,
                speed: 20,
                lifetime: 0.8
            },
            'Special Attack': {
                name: 'Flash Step',
                radius: 3,
                lifetime: 0.5,
                opacity: 0.4
            },
            'Ultimate Attack': {
                name: 'Solar Flare',
                radius: 12,
                lifetime: 1.5,
                opacity: 0.8
            }
        }
    },
    
    magma: {
        name: 'Magma Fruit',
        type: 'magma',
        power: 42,
        attacks: ['Magma Ball', 'Lava Slam', 'Volcanic Eruption'],
        specialProperties: {
            burnDuration: 4,
            burnDamage: 3,
            terrainDamage: true
        },
        colors: {
            primary: 0xff3300,
            secondary: 0xdd2200,
            ultimate: 0xbb1100
        },
        attackSettings: {
            'Basic Attack': {
                name: 'Magma Ball',
                range: 3,
                speed: 12,
                lifetime: 2
            },
            'Special Attack': {
                name: 'Lava Slam',
                radius: 6,
                lifetime: 2.5,
                opacity: 0.7
            },
            'Ultimate Attack': {
                name: 'Volcanic Eruption',
                radius: 10,
                lifetime: 3,
                opacity: 0.8
            }
        }
    }
}; 