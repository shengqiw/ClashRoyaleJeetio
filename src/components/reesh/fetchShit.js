import config from '../../config/config.json'
import aws from 'aws-sdk'

export async function fetchShit() {
    try {
        aws.config.setPromisesDependency();
        aws.config.update({
            accessKeyId: config["access-key"],
            secretAccessKey: config["access-secret"],
            region: 'us-east-1',
        })
        const s3 = new aws.S3();
        const response = await s3.listObjectsV2({
            Bucket: 'testing-zen-garden'
        }).promise();
        const keys = response.Contents.map(item => item.Key);
        console.log(response.Contents);
        console.log('Keys', keys);
        const thingy = await s3.getObject({
            Bucket: 'testing-zen-garden',
            Key: keys[1]
        }, (err, data) => {
            if (err) return new Error('you fucked up boi');
            else {
                console.log('getObjects() => ', data.Body.toString('ascii'));
            }
        });

        console.log('thingy below', thingy)

    } catch (e) {
        console.log('ERROR IN UR SHIT BRO', e);
    }
    console.log('hello from fetchSHit')
} 