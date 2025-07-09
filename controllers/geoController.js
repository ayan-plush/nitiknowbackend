const { responseReturn } = require("../utils/response");
const { feature } = require('topojson-client');
const { point, booleanPointInPolygon } =  require('@turf/turf');
const { indiaPcJson } = require("../utils/geoData");
const { assemblyData } = require("../utils/geoAssemblyData");
const { mpLokSabhaData } = require("../utils/lokSabhaData");
const loksabhaMpModel = require("../models/loksabhaMpModel");
const cloudinary = require('cloudinary').v2
const axios = require("axios");
const sharp = require("sharp");
const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");



class geoControllers {

    getConstituency = async (req,res) => {

        const { lat, lon } = req.query;


        try{
            const geoConstituencyJson = feature(indiaPcJson, indiaPcJson.objects.india_pc_2014);
            if(!lat||!lon){
                throw new Error('invalid coordinates')
            }
            else{
                const pointer = point([parseFloat(lon), parseFloat(lat)]);
                let constituency;
                for (const feature of geoConstituencyJson.features) {
                    if (booleanPointInPolygon(pointer, feature)) {
                    constituency = feature.properties;
                    }
                }
                if(!constituency){
                    throw new Error('out of bound coordinates')
                }
                else{
                    responseReturn(res,200,{constituency, message: 'constituency found'})
                }
            }

        }
        catch(error){
            responseReturn(res,404,{error: error.message})
        }
    }

    getAssemblyConstituency = async (req,res) => {
        const {lat,lon} = req.query;

        try{
            const geoAssemblyJson = feature(assemblyData, assemblyData.objects.India_AC);
            if(!lat||!lon){
                throw new Error('invalid coordinates')
            }
            else{
                const pointer = point([parseFloat(lon), parseFloat(lat)]);
                let assembly;
                for (const feature of geoAssemblyJson.features) {
                    if (booleanPointInPolygon(pointer, feature)) {
                    assembly = feature.properties;
                    }
                }
                if(!assembly){
                    throw new Error('out of bound coordinates')
                }
                else{
                    responseReturn(res,200,{assembly, message: 'assembly found'})
                }
            }

        }
        catch(error){
            responseReturn(res,404,{error: error.message})
        }
    }

    getLokSabhaMember = async (req,res) => {
        const {pc} = req.query;

        try{
            if(!pc){
                throw new Error('invalid constituency')
            }
            else{
                // let LokSabhaMinister;
                // for (const mp of mpLokSabhaData) {
                //     if (pc==mp.pc_name) {
                //     LokSabhaMinister = mp;
                //     }
                // }
                const LokSabhaMinister = await loksabhaMpModel.findOne({ pcName: pc })
                if(!LokSabhaMinister){
                    throw new Error('does not exist')
                }
                else{
                    responseReturn(res,200,{LokSabhaMinister, message: 'lok sabha elective found'})
                }
            }

        }
        catch(error){
            responseReturn(res,404,{error: error.message})
        }
    }

    sabhaMemberDataAdd = async (req,res) => {

        const parseToISO = (dateString)=>{
            if (!dateString || dateString.toLowerCase() === 'in office') return null;
            const [day, month, year] = dateString.split('-');
            return new Date(`${year}-${month}-${day}`).toISOString();
        }


        try{
                for (const mp of mpLokSabhaData) {
                    let lokmp = await loksabhaMpModel.findOne({ name: mp.mp_name })
                    if(!lokmp){
                    lokmp = await loksabhaMpModel.create({
                        name: mp.mp_name,
                        electionIndex: parseInt(mp.mp_election_index),
                        startDate: parseToISO(mp.term_start_date),
                        endDate: parseToISO(mp.term_end_date),
                        termCount: mp.term,
                        pcName: mp.pc_name,
                        state: mp.state,
                        politicalParty: mp.mp_political_party,
                        gender: mp.mp_gender,
                        education: {
                            educational_qualification: mp.educational_qualification,
                            educational_qualification_details: mp.educational_qualification_details,
                        },
                        method: "manually",
                    })
                    }
                }
                responseReturn(res,200,{message: "diva down"})
                

        }
        catch(error){
            responseReturn(res,404,{error: error.message})
        }
    }

    sabhaMemberImageAdd = async(req,res) => {

cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.cloud_api_key,
    api_secret: process.env.cloud_api_secret,
    secure: true,
});

const fetchImageFromSerpAPI = async (query) => {
    console.log(`🔎 [fetchImageFromSerpAPI] Searching image for: "${query}"`);
    const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&api_key=${process.env.SERP_API_KEY}`;
    const res = await axios.get(serpUrl);
    const img = res.data.images_results?.[0]?.original || null;
    console.log(`📸 [fetchImageFromSerpAPI] Image URL found: ${img}`);
    return img;
};

const downloadImage = async (url) => {
    console.log(`⬇️ [downloadImage] Downloading image from: ${url}`);
    const res = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(res.data, "binary");
    console.log(`✅ [downloadImage] Image downloaded (${buffer.length} bytes)`);
    return buffer;
};

const removeBgPhotoroom = async (buffer) => {
            console.log(`🎯 [removeBgPhotoroom] Removing background...`);
            const form = new FormData();
            form.append("image_file", buffer, {
                filename: "input.jpg",
                contentType: "image/jpeg"
            });

            const res = await axios.post("https://sdk.photoroom.com/v1/segment", form, {
                headers: {
                    "x-api-key": process.env.PHOTOROOM_API_KEY,
                    ...form.getHeaders(),
                },
                responseType: "arraybuffer",
            });
            const processed = Buffer.from(res.data, "binary");
            console.log(`🧼 [removeBgPhotoroom] Background removed (${processed.length} bytes)`);
            return processed;
        };
const removeBgSlazzer = async (buffer) => {
            console.log(`🎯 [slazzer] Removing background...`);
            // const settings = {
            // url: "https://api.slazzer.com/v2.0/remove_image_background",
            // apiKey: "YOUR_SLAZZER_API_KEY",
            // sourceImagePath: "YOUR_IMAGE_PATH",
            // outputImagePath: "output.png"
            // };
            const form = new FormData();
            form.append("image_file", buffer, {
                filename: "input.jpg",
                contentType: "image/jpeg"
            });

            const res = await axios.post("https://api.slazzer.com/v2.0/remove_image_background",form, {
                headers: {
                    "API-KEY": process.env.SLAZZER_API_KEY,
                },
                encoding: null,
            });
            const processed = Buffer.from(res.data, "binary");
            console.log(`🧼 [removeBgPhotoroom] Background removed (${processed.length} bytes)`);
            return processed;
        };


// const settings = {
//   url: "https://api.slazzer.com/v2.0/remove_image_background",
//   apiKey: "YOUR_SLAZZER_API_KEY",
//   sourceImagePath: "YOUR_IMAGE_PATH",
//   outputImagePath: "output.png"
// };

// request.post(
//   {
//     url: settings.url,
//     formData: {source_image_file: fs.createReadStream(settings.sourceImagePath),},
//     headers: {"API-KEY": settings.apiKey,},
//     encoding: null,
//   },
//   function (error, response, body) {
//     if(error){ console.log(error); return;}
//     if(response.statusCode != 200){ console.log(body.toString('utf8')); return; }
//     fs.writeFileSync(settings.outputImagePath, body);
//   }
// );


        const processImage = async (buffer) => {
            console.log(`🎨 [processImage] Applying grayscale and contrast...`);
            const output = await sharp(buffer)
                .grayscale()
                .linear(1.3, -30)
                .toFormat("png")
                .toBuffer();
            console.log(`🖼️ [processImage] Image processed (${output.length} bytes)`);
            return output;
        };

        const uploadToCloudinary = async (name, buffer) => {
            const tempPath = path.join(__dirname, `../temp-${Date.now()}.png`);
            console.log(`📁 [uploadToCloudinary] Saving temp file: ${tempPath}`);
            await fs.writeFile(tempPath, buffer);

            console.log(`☁️ [uploadToCloudinary] Uploading to Cloudinary...`);
            const result = await cloudinary.uploader.upload(tempPath, {
                folder: "ministers",
                public_id: name.replace(/\s+/g, "_"),
                resource_type: "image",
            });

            await fs.remove(tempPath);
            console.log(`✅ [uploadToCloudinary] Uploaded URL: ${result.secure_url}`);
            return result.secure_url;
        };

        try {
            for (const mp of [mpLokSabhaData[0]]) {
                console.log(`➡️ Processing MP: ${mp.mp_name}`);
                const existing = await loksabhaMpModel.findOne({ name: mp.mp_name });
                if (!existing) {
                    console.warn(`⚠️ MP not found in DB: ${mp.mp_name}`);
                    continue;
                }

                if (existing.imageUrl) {
                    console.log(`✅ Already has image: ${mp.mp_name}`);
                    continue;
                }

                const imgUrl = await fetchImageFromSerpAPI(mp.mp_name);
                if (!imgUrl) {
                    console.warn(`❌ Image not found for ${mp.mp_name}`);
                    continue;
                }

                const original = await downloadImage(imgUrl);
                const noBg = await removeBgSlazzer(original);
                const final = await processImage(noBg);
                const uploadedUrl = await uploadToCloudinary(mp.mp_name, final);

                existing.imageUrl = uploadedUrl;
                await existing.save();

                console.log(`🎉 Uploaded image for: ${mp.mp_name}`);
            }

            responseReturn(res, 200, { message: "Images processed successfully" });
        } catch (error) {
            console.error(`💥 Error: ${error.message}`);
            responseReturn(res, 500, { error: error.message });
        }

    }
}

module.exports = new geoControllers()