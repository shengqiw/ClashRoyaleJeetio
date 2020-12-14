import config from '../../config/config.json'
import aws from 'aws-sdk'
import Chance from 'chance'
const chance = new Chance();
let S3 = null;
const getS3 = () => {
    if (!S3) {
        S3 = new aws.S3();
    }
    return S3;
}

(function authShit() {
    aws.config.setPromisesDependency();
    aws.config.update({
        accessKeyId: config["access-key"],
        secretAccessKey: config["access-secret"],
        region: 'us-east-1'
    });
})();


async function fetchBucket() {
    return await getS3().listObjectsV2({
        Bucket: 'testing-zen-garden'
    }).promise().then(data => data);
}

async function fetchObject(key) {
    const response = await getS3().getObject({
        Bucket: 'testing-zen-garden',
        Key: key
    }).promise();
    return response.Body.toString('ascii')
}

function getKeys(bucket) {
    return bucket.map(item => item.Key);;
}


export async function fetchShit() {

    const { Contents: contents } = await fetchBucket();

    console.log('Bucket Contents', contents);

    console.log('mapping keys...')
    return getKeys(contents);
}

async function executioner(key) {
    var params = { Bucket: 'testing-zen-garden', Key: key };
    getS3().deleteObject(params, function (err, data) {
        if (err) console.log(err, err.stack);  // error
        else {
            console.log('delete data', data);                 // deleted
        }
    });
}

export async function deleteShit() {
    console.log('Thanos - \'I am inevitible, perfectly balanced as all things should be\'');
    const keys = await fetchShit();
    const counter = { count: 0 }
    console.log('Total Keys:', keys.length);
    keys.forEach(async key => {
        if (chance.bool()) {
            counter.count++;
            console.log('count: ', counter.count);
            // await executioner(key);
        }
    })
}

export async function addShit() {
    console.log('Supreme Kai restoring balance');
}