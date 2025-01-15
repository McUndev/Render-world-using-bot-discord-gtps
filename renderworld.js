const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const config = require('./botconfig.json');
const exec = require('child_process').exec;
const lineReader = require('line-reader');
var randomColor = require('randomcolor');
const request = require('request');
const cooldowns = {};
const { MessageEmbed } = require('discord.js');

const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32': cmd = `tasklist`; break;
        case 'darwin': cmd = `ps -ax | grep ${query}`; break;
        case 'linux': cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}
const getAllFiles = function (dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, file))
        }
    })

    return arrayOfFiles
}
const convertBytes = function (bytes) {
    const sizes = ["Bytes", "KiB", "MiB", "GiB", "TiB"]

    if (bytes == 0) {
        return "0 Bytes"
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

    if (i == 0) {
        return bytes + " " + sizes[i]
    }

    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}
const getTotalSize = function (directoryPath) {
    const arrayOfFiles = getAllFiles(directoryPath)

    let totalSize = 0

    arrayOfFiles.forEach(function (filePath) {
        totalSize += fs.statSync(filePath).size
    })

    return convertBytes(totalSize)
}

function getWeatherFileName(id) {
    return `weather/${id}.png`;
}

function getItemById(itemID) {
    const itemsData = fs.readFileSync('render_items/items.json', 'utf8');
    const items = JSON.parse(itemsData);
    const item = items.items.find(item => item.item_id === itemID);
    if (item) {
        return item;
    } else {
        console.error('Item not found with ID:', itemID);
        return null;
    }
}

function getTextureData(itemName) {
    const textureData = fs.readFileSync('render_items/texture.json', 'utf8');
    const items = JSON.parse(textureData);
    const item = items.texture.find(item => item.item_name === itemName);
    if (item) {
        return item;
    } else {
        console.error('Item not found with name:', itemName);
        return null;
    }
}

client.on('ready', () => {

    console.log(`${client.user.tag} bot Started!`)
    let http_status = "> <:offline:1058229688759238677> Offline"
    setInterval(function () {
        request({ url: "http://cdn.growgtps.my.id/", rejectUnauthorized: false, json: true }, function (err) {
            if (err) {
                if (err == "ECONNTIMEDOUT") {
                    http_status = "> <:offline:1058229688759238677> Offline"
                } else {
                    http_status = "> <:UP:1100110959323910257> Online"
                }
            } else {
                http_status = "> <:UP:1100110959323910257> Online"
            }
        })
        isRunning('McPs.exe', (status) => {
            if (status == true) {
                lineReader.eachLine('online.txt', function (line) {
                    if (line == "0" || line == "1") client.user.setActivity(`No one is playing the server, pls play :(`, {
                        type: 'WATCHING',
                    });
                    else client.user.setActivity(line + ` Players Online`, {
                        type: 'WATCHING',
                    });
                });
            } else {
                client.user.setActivity(`Server Offline For Maintenance`, { type: 'WATCHING' });
            }
        })
    }, 28282)

    const statusz = new Discord.MessageEmbed()
        .setColor('#ff0000')
        .setAuthor(`GTPS SERVER`)
        .addField('Fetching Server Status', 'Please wait...')
        .addField('Fetching all Server Data', 'Please wait...')
        .setTimestamp()
        .setFooter('Last Status Update');

    client.channels.cache.get(config.channel).send(statusz).then((msg) => {

        setInterval(function () {
            var color = randomColor();
            isRunning('McPs.exe', (status) => {
                if (status == true) {
                    lineReader.eachLine('online.txt', function (line) {
                        if (line == "0" || line == "1") line = "No one is playing the server, pls play :(";
                        else line = "`" + line + "` Players";
                        lineReader.eachLine('uptime.txt', function (line1) {
                            const f1 = fs.readdirSync(config.player).length
                            const f2 = fs.readdirSync(config.world).length
                            const f3 = fs.readdirSync(config.guild).length
                            const DataDir = config.db_directory;
                            const sf1 = getTotalSize(`./${DataDir}players`)
                            const sf2 = getTotalSize(`./${DataDir}worlds`)
                            const sf3 = getTotalSize(`./${DataDir}guilds`)

                            const statuszz = new Discord.MessageEmbed()
                                .setColor(color)
                                .setAuthor(`${msg.guild.name}`, msg.guild.iconURL())
                                .addField(`<:SB:1100110994891624578> **HTTP Server: **`, `${http_status}`)
                                .addField('<:SB:1100110994891624578> **Main Server Status:**', '> <:UP:1100110959323910257> Online')
                                .addField('<:System:1100111033139478699> **Server Uptime**', "```" + line1 + "```")
                                .addField('<:System:1100111033139478699> **Players Online:**', line)
                                .addField('<:System:1100111033139478699> **Total Players Registered: **', "`" + f1.toLocaleString() + "` Account Registered")
                                .addField('<:System:1100111033139478699> **Total Worlds Created: **', "`" + f2.toLocaleString() + "` Worlds Created")
                                .addField('<:System:1100111033139478699> **Total Guilds Created: **', "`" + f3.toLocaleString() + "` Guilds Created")
                                .addField('<:System:1100111033139478699> **Players Data Size: **', "`" + sf1 + "`")
                                .addField('<:System:1100111033139478699> **Worlds Data Size: **', "`" + sf2 + "`")
                                .addField('<:System:1100111033139478699> **Guilds Data Size: **', "`" + sf3 + "`")
                                .setTimestamp()
                                .setFooter('Last Status Update', 'https://media.discordapp.net/attachments/1052919696757891083/1070916483087077386/944424460075810856.png');
                            msg.edit(statuszz);
                        });
                    });
                }
                else {
                    const f1 = fs.readdirSync(config.player).length
                    const f2 = fs.readdirSync(config.world).length
                    const f3 = fs.readdirSync(config.guild).length
                    const DataDir = config.db_directory;
                    const sf1 = getTotalSize(`./${DataDir}players`)
                    const sf2 = getTotalSize(`./${DataDir}worlds`)
                    const sf3 = getTotalSize(`./${DataDir}guilds`)
                    const statusz = new Discord.MessageEmbed()
                        .setColor(color)
                        .setAuthor(`${msg.guild.name}`, msg.guild.iconURL())
                        .addField(`<:SB:1083282198620291082> **HTTP Server: **`, `${http_status}`)
                        .addField('<:SB:1083282198620291082> **Main Server Status:**', '> <:offline:1058229688759238677> Offline')
                        .addField('<:System:1083282142013964331> **Server Uptime**', '`NULL`')
                        .addField('<:System:1083282142013964331> **Players Online:**', '`NULL`')
                        .addField('<:System:1083282142013964331> **Total Players Registered: **', "`" + f1.toLocaleString() + "` Account Registered")
                        .addField('<:System:1083282142013964331> **Total Worlds Created: **', "`" + f2.toLocaleString() + "` Worlds Created")
                        .addField('<:System:1083282142013964331> **Total Guilds Created: **', "`" + f3.toLocaleString() + "` Guilds Created")
                        .addField('<:System:1083282142013964331> **Players Data Size: **', "`" + sf1 + "`")
                        .addField('<:System:1083282142013964331> **Worlds Data Size: **', "`" + sf2 + "`")
                        .addField('<:System:1083282142013964331> **Guilds Data Size: **', "`" + sf3 + "`")
                        .setTimestamp()
                        .setFooter('Last Status Update', 'https://media.discordapp.net/attachments/1052919696757891083/1070916483087077386/944424460075810856.png');
                    msg.edit(statusz);
                }
            })
        }, 28282)
    });
})

client.on('message', async (message) => {
    if (!message.content.startsWith(config.prefix)) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    let pf = config.prefix;
    if (command === 'rw') {
        const args = message.content.split(' ');
        if (args.length !== 2) {
            return message.channel.send('Usage: b!rw <world_name>');
        }

        const worldName = args[1];

        try {
            const DataDir = config.db_directory;
            const worldData = fs.readFileSync(`${DataDir}worlds/${worldName}_.json`, 'utf8');
            const jsonData = JSON.parse(worldData);

            if (!jsonData.hasOwnProperty('blocks')) {
                return message.channel.send("Property 'blocks' not found in the JSON file.");
            }

            const blocksArray = jsonData.blocks;
            const worldWidth = jsonData.width;
            const worldHeight = jsonData.height;
            const canvasWidth = 3200;
            const canvasHeight = 1920;
            const canvas = createCanvas(canvasWidth, canvasHeight);
            const ctx = canvas.getContext('2d');

            let loadedImagesCount = 0;
            let weatherImagePromise = Promise.resolve(); // Default promise if no weather image
            let weatherImage = null;
            const renderedBlocks = {}; // Cache for rendered blocks

            if (jsonData.hasOwnProperty('d_weather')) {
                const weatherId = jsonData.d_weather;
                const weatherFileName = getWeatherFileName(weatherId);
                weatherImagePromise = loadImage(weatherFileName).then((image) => {
                    console.log('Weather Id: %d', weatherId);
                    weatherImage = image;
                    loadedImagesCount++;
                }).catch((error) => {
                    console.error(`Failed to load image ${weatherFileName}:`, error);
                    loadedImagesCount++;
                });
            } else {
                loadedImagesCount++; // If no weather image, proceed
            }

            // Asynchronous rendering function for other images
            async function renderOtherImages() {
                // Draw weather image as background if available
                if (weatherImage !== null) {
                    ctx.drawImage(weatherImage, 0, 0, canvasWidth, canvasHeight);
                }
                // Loop through all blocks and render images according to their types
                for (let i = 0; i < blocksArray.length; i++) {
                    const obj = blocksArray[i];
                    if (obj !== null) {
                        const f = obj.f;
                        const b = obj.b;
                        if (f !== undefined && b !== undefined) {
                            // Both foreground and background exist
                            await renderBlock(b, i, 'background');
                            await renderBlock(f, i, 'foreground');
                        } else if (f !== undefined) {
                            // Only foreground exists
                            await renderBlock(f, i, 'foreground');
                        } else if (b !== undefined) {
                            // Only background exists
                            await renderBlock(b, i, 'background');
                        }
                    }
                }
                // Save the rendered world to a file
                const out = fs.createWriteStream(`${DataDir}render/${worldName}.png`);
                const stream = canvas.createPNGStream();
                stream.pipe(out);
                out.on('finish', () => {
                    console.log('World successfully rendered and saved as worldName.png.');
                    message.channel.send(`World ${worldName} has been rendered.`, {
                        files: [`${DataDir}render/${worldName}.png`]
                    });
                });
            }
            async function renderBlock(id, index, type) {
                // Check if block is already rendered
                const blockKey = `${id}_${type}`;
                if (blockKey in renderedBlocks) {
                    // Use cached image if available
                    const { x, y, image } = renderedBlocks[blockKey];
                    const xCoord = (index % worldWidth) * (canvasWidth / worldWidth);
                    const yCoord = Math.floor(index / worldWidth) * (canvasHeight / worldHeight);
                    ctx.drawImage(image, x, y, canvasWidth / worldWidth, canvasHeight / worldHeight, xCoord, yCoord, canvasWidth / worldWidth, canvasHeight / worldHeight);
                } else {
                    // Render the block
                    const item = getItemById(id);
                    const textureInfo = getTextureData(item.name);
                    let textureX, textureY;
                    if (type === 'foreground') {
                        // For foreground blocks, set the texture coordinates based on texture_above_x and texture_above_y
                        textureX = (textureInfo && textureInfo.texture_above_x) ? textureInfo.texture_above_x * 32 : item.texture_x * 32;
                        textureY = (textureInfo && textureInfo.texture_above_y) ? textureInfo.texture_above_y * 32 : item.texture_y * 32;
                    } else {
                        // For background blocks, use the default texture coordinates
                        textureX = item.texture_x * 32;
                        textureY = item.texture_y * 32;
                    }
                    if (textureInfo) {
                        // Adjust texture coordinates based on surrounding blocks
                        const surroundingBlocks = {
                            above: blocksArray[index - worldWidth],
                            below: blocksArray[index + worldWidth],
                            left: blocksArray[index - 1],
                            right: blocksArray[index + 1]
                        };
                        const side = ['above', 'below', 'left', 'right'].find(side => surroundingBlocks[side] !== undefined);
                        if (side) {
                            textureX = (textureInfo[`texture_${side}_x`] !== undefined) ? textureInfo[`texture_${side}_x`] * 32 : textureX;
                            textureY = (textureInfo[`texture_${side}_y`] !== undefined) ? textureInfo[`texture_${side}_y`] * 32 : textureY;
                        }
                    }
                    
                    const fileName = `texture/${item.texture}`;
                    const image = await loadImage(fileName);
                    const xCoord = (index % worldWidth) * (canvasWidth / worldWidth);
                    const yCoord = Math.floor(index / worldWidth) * (canvasHeight / worldHeight);
                    ctx.drawImage(image, textureX, textureY, 32, 32, xCoord, yCoord, canvasWidth / worldWidth, canvasHeight / worldHeight);

                    renderedBlocks[blockKey] = { x: textureX, y: textureY, image };
                }
            }
            weatherImagePromise.then(() => {
                renderOtherImages();
            });

        } catch (error) {
            console.error("Failed to process JSON file:", error);
            message.channel.send('An error occurred while processing the JSON file.');
        }
    }

    if (command === 'help') {
        if (message.channel.type == 'dm')
            return message.reply('Please use in GTPS SERVER Discord.');
        if (!message.member.roles.cache.has(config.role_id))
            return message.channel.send(`
  \`\`\`
  Commands are:
  ${pf}help (Showing Commands)
  \`\`\`
  `);
        else
            message.channel.send(`
  \`\`\`
  Commands are:
  ${pf}help (Showing Commands)
  ${pf}info (Showing Information Player)
  ${pf}link (Link your GTPS SERVER account through your discord)
  ${pf}renderworld (render your world on McPs server)
  \`\`\`
  `);
    }
});

client.login(config.token);
