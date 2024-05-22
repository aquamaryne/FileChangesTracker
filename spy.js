const chokidar = require('chokidar');
const process = require('process');
const fs = require('fs-extra');
const diff = require('diff');

const directoryToWatch = '/home/keeper/Documents/GitHub/LabHub_client' //внести путь к дериктории;

const fileContents = {};

const watcher = chokidar.watch(directoryToWatch, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: false,
    depth: Infinity
});

const readFile = (path) => {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if(err) reject(err);
            else resolve(data);
        });
    });
};

watcher
    .on('add', async path => {
        try{
            const content = await readFile(path);
            fileContents[path] = content;
            console.log(`File added: ${path}`);
        } catch (err) {
            console.error(`Error reading file: ${path}`, err);
        }
    })
    .on('change', async path => {
        try{
            const newContent = await readFile(path);
            const oldContent = fileContents[path];
            const changes = diff.diffLines(oldContent, newContent);
            changes.forEach(change => {
                if(change.added){
                    console.log(`Added to ${path}: \n${change.value}`);
                } else if(change.removed){
                    console.log(`Deleted from ${path}: \n${change.value}`);
                }
            });
            fileContents[path] = newContent;
            console.log(`File changed: ${path}`);
        } catch(err){
            console.error(`Error reading file changes: ${path}`, err);
        }
    })
    .on('unlink', path => {
        delete fileContents[path];
        console.log(`File deleted ${path}`);
    })
    .on('addDir', path => console.log(`Directory added: ${path}`))
    .on('unlinkDir', path => console.log(`Directory removed: ${path}`))
    .on('error', path => console.error(`Error: ${path}`))
    .on('ready', () => console.log('Scan complete. Ready to track changes'))
    .on('raw', (event, path, details) => {
        console.log('RAW event:', event, path, details);
    });

const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('SIGINT', () => {
    console.log('Signal capture SIGINT. Wathcer close...');
    watcher.close().then(() => {
        console.log('Wathcer close');
        rl.close();
        process.exit(0);
    });
});

setInterval(() => {}, 1000);

