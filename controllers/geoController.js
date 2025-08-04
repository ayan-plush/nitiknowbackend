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
const GoogleSearch = require('../utils/googleSearch.js');
const FormData = require("form-data");
// const HttpsProxyAgent = require("https-proxy-agent");
  const { getJson } = require("serpapi");
const loksabhaArticlesModel = require("../models/loksabhaArticlesModel");
const loksabhaMPDataModel = require("../models/loksabhaMPDataModel.js");




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
    const qs = `${query} prs`
    console.log(`🔎 [fetchImageFromSerpAPI] Searching image for: "${query}"`);
    const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(qs)}&tbm=isch&api_key=${process.env.SERP_API_KEY}`;
    const res = await axios.get(serpUrl);
    const img = res.data.images_results?.[0]?.original || null;
    console.log(`📸 [fetchImageFromSerpAPI] Image URL found: ${img}`);
    return img;
};
// const fetchImageFromSerpAPI = async (query) => {

//   console.log(`🔎 [fetchImageFromSerpAPI] Searching image for: "${query}"`);
//   const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&engine=google_images&ijn=0&api_key=${process.env.SERP_API_KEY}`;
//   const res = await axios.get(serpUrl);


//     getJson({
//     q: `${query}`,
//     engine: "google_images",
//     api_key: process.env.SERP_API_KEY
//     }, (json) => {
//     console.log(json["related_searches"],'okkk');
//     });


//   const images = res.data.images_results || [];

//   for (const result of images) {
//     const imgUrl = result.thumbnail;
//     if (!imgUrl) continue;

//     try {
//       console.log(`⬇️ [downloadImage] Trying image: ${imgUrl}`);
//       const response = await axios.get(imgUrl, {
//         responseType: 'arraybuffer',
//         headers: {
//           'User-Agent': 'Mozilla/5.0',
//           "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8" // Helps avoid bot blocks
//         }
//       });

//       const buffer = Buffer.from(response.data);
//       const type = await fileType.fromBuffer(buffer);

//       if (type && ['image/jpeg', 'image/png', 'image/webp'].includes(type.mime) && buffer.length > 5000) {
//         console.log(`✅ [fetchImageFromSerpAPI] Valid image found: ${imgUrl}`);
//         return imgUrl;
//       } else {
//         console.warn(`❌ Skipping invalid image: ${type?.mime}, ${buffer.length} bytes`);
//       }
//     } catch (err) {
//       console.warn(`⚠️ Failed to fetch image: ${imgUrl}`, err.message);
//     }
//   }

//   console.error(`❌ No valid image found for: ${query}`);
//   return null;
// };


const downloadImage = async (url) => {
    console.log(`⬇️ [downloadImage] Downloading image from: ${url}`);
    const res = await axios.get(url, { responseType: "arraybuffer" ,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', // Spoof browser
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.google.com/', // Makes it look like image search
            'DNT': '1', // Do Not Track
            'Upgrade-Insecure-Requests': '1',
        },
        timeout: 8000,
        maxRedirects: 5,
    });
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


const removeBg = async (buffer) => {
            const form = new FormData();

            form.append("image_file", buffer, {
                filename: "input.jpg",
                contentType: "image/jpeg",
            });

            // Optional: Use size=preview to avoid credit usage (low-res image)
            form.append("size", "preview");

            try {
                const response = await axios.post("https://api.remove.bg/v1.0/removebg", form, {
                headers: {
                    ...form.getHeaders(),
                    "X-Api-Key": process.env.REMOVE_BG_API_KEY, // 🔑 Put your API key here
                },
                responseType: "arraybuffer", // So we get binary data
                });

                return Buffer.from(response.data);
            } catch (err) {
                const msg = err.response?.data?.errors || err.message;
                console.error("❌ [Remove.bg] Error:", msg);
                throw err;
            }
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
            form.append("source_image_file", buffer, {
                filename: "input.jpg",
                contentType: "image/jpeg"
            });
            form.append("preview", "true");


            const res = await axios.post("https://api.slazzer.com/v2.0/remove_image_background",form, {
                headers: {
                    "API-KEY": process.env.SLAZZER_API_KEY,
                    ...form.getHeaders(),
                },
                encoding: null,
                responseType: "arraybuffer",
            });
            const processed = Buffer.from(res.data, "binary");
            console.log(`🧼 [removeBgPhotoroom] Background removed (${processed.length} bytes)`);
            return processed;
        };
// const rembg = new Rembg({
//   logging: true, // optional
// });



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

        const fetchImageFromSerpAPIAndProcess = async (query) => {
            console.log(`🔎 [fetchImageFromSerpAPI] Searching image for: "${query}"`);
            const serpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&api_key=${process.env.SERP_API_KEY}`;

            let res;
            try {
                res = await axios.get(serpUrl);
            } catch (err) {
                console.error(`❌ Failed to fetch SerpAPI results: ${err.message}`);
                return null;
            }

            const images = res.data.images_results || [];

            for (const result of images) {
                const imgUrl = result.original;
                if (!imgUrl) continue;

                try {
                console.log(`⬇️ [downloadImage] Trying image: ${imgUrl}`);
                const response = await axios.get(imgUrl, {
                    responseType: "arraybuffer",
                });

                const buffer = Buffer.from(response.data);
                // const type = await fileType.fromBuffer(buffer);

                // if (
                //     !type ||
                //     !["image/jpeg", "image/png", "image/webp"].includes(type.mime) ||
                //     buffer.length < 5000
                // ) {
                //     console.warn(`❌ Skipping: ${type?.mime || "unknown"}, ${buffer.length} bytes`);
                //     continue;
                // }

                console.log(`✅ [validImage] Image passed validation, now processing...`);

                const processed = await sharp(buffer)
                    .grayscale()
                    .linear(1.3, -30)
                    .toFormat("png")
                    .toBuffer();

                console.log(`🖼️ [processImage] Processed image (${processed.length} bytes)`);
                return processed;

                } catch (err) {
                console.warn(`⚠️ Failed to process image: ${imgUrl}`, err.message);
                }
            }

            console.error(`❌ No valid processable image found for: ${query}`);
            return null;
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

        console.log(mpLokSabhaData.length);

        try {
            for (const mp of mpLokSabhaData) {
                try{
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

                // const final2 = fetchImageFromSerpAPIAndProcess(mp.mp_name);

                const imgUrl = await fetchImageFromSerpAPI(mp.mp_name);
                if (!imgUrl) {
                    console.warn(`❌ Image not found for ${mp.mp_name}`);
                    continue;
                }

                // // const noBg = await removeBgLocally(original);
                
                const original = await downloadImage(imgUrl);
                const final = await processImage(original);
                const uploadedUrl = await uploadToCloudinary(mp.mp_name, final);
                const noBgUrl = uploadedUrl.replace('/upload/', '/upload/e_background_removal/');
                existing.imageUrl = noBgUrl;
                console.log(noBgUrl);
                await existing.save(noBgUrl);

                console.log(`🎉 Uploaded image for: ${mp.mp_name}`);

                }
                
                catch(error){
                    console.error(`💥 Error: ${error.message}`);
                }
            }

            responseReturn(res, 200, { message: "Images processed successfully" });
        } catch (error) {
            console.error(`💥 Error: ${error.message}`);
            responseReturn(res, 500, { error: error.message });
        }

    }
    getNewsData = async (req,res) => {
        const {minister} = req.body;
        const headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36"
        };

        try {
            const encoded = encodeURIComponent(minister);
            const url = `https://news.google.com/search?q=${encoded}&hl=en-IN&gl=IN&ceid=IN:en`;
            const response = await axios.get(url, { headers });
            const html = response.data;
            console.log(html);
            const regex = /data:(\[.*?\]), sideChannel/s;
            const match = html.match(regex);
            if (!match || !match[0]) {
                throw new Error('No valid JSON data found');
            }
            let resp = [];
            const data = JSON.parse(match[1]);
            for (const section of data[1][3][1]) {
                if (Array.isArray(section[0])) {
                    for (const item of section[0]) {
                        const utcTime = new Date(item[4][0] * 1000).toISOString();
                        resp.push({
                            title: item[2],
                            source: {
                                name: item[10][2],
                                icon: item[10][22]?.[0] || null, // Safe access to nested properties
                                authors: item[item.length - 1]?.[0] || []
                            },
                            link: item[38],
                            thumbnail: item[8]?.[0]?.[13] || null,
                            thumbnail_small: item[8]?.[0]?.[0] || null,
                            date: utcTime
                        });
                        break;
                    }
                }
            }
            console.log(resp);
            responseReturn(res,200, {data: resp});
        } catch (error) {
            console.error('Error:', error.message);
            responseReturn(res,400, {error: error.message});
        }
    }

    getNewsDataModule = async (req,res) => {
        const {query} = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Missing query' });
        }

        try {
            const results = await GoogleSearch.search(query, {
                numResults: 15,
                region: 'IN',
                unique: true
            });
            res.json({ results });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }

    }

    scrapeMinisterNews = async (req,res) => {
        const {minister, mpId} = req.body;
        console.log(minister,mpId)
        const query = minister;
        const now = new Date();
        const twoHourAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        if (!minister||!mpId) {
            return res.status(400).json({ error: 'Missing query' });
        }
        try {
            const articles = await loksabhaArticlesModel.find({ politician: mpId }).sort({ createdAt: -1 }); 
            responseReturn(res,200,{data: articles})
            // res.json({ articles });
        } catch (error) {
            console.error("Error fetching articles:", error);
            responseReturn(res,500,{error: "Failed to fetch articles" })
        }
        let lokmp = await loksabhaMpModel.findById(mpId)
        if(!lokmp.lastScrapedAt || lokmp.lastScrapedAt < twoHourAgo){
            try {
                const results = await GoogleSearch.search(query, {
                    numResults: 15,
                    region: 'IN',
                    unique: true
                });
                for(const article of results){
                    const articleExists = await loksabhaArticlesModel.findOne({ url: article.url });
                    if(!articleExists){
                        await loksabhaArticlesModel.create({
                            politician: lokmp._id,
                            politicianName: lokmp.name,
                            title: article.title,
                            url: article.url,
                            description: article.description,
                            img: article.img,
                            text: article.articleText
                        })
                    }
                }
                lokmp.lastScrapedAt = now;

                // results.map(async (article) => {
                //     const exists = await loksabhaArticlesModel.findOne({ url: article.url });
                // })
                // res.json({ results });
            } catch (err) {
               return res.status(500).json({ error: err.message });
            }
            await lokmp.save();
        }
    };

    fetchPRSData = async (req,res) => {
        const {minister,constituency} = req.body
        console.log(minister,constituency)

        // const qs = `${query} prs`
        // console.log(`🔎 [fetchImageFromSerpAPI] Searching image for: "${query}"`);
        
        try{
            const endPoint = `http://0.0.0.0:8000/scrape-deb`;
            const result = await axios.post(endPoint,{ minister, constituency });
            console.log(result.data);
            responseReturn(res,200,{data: result.data.results})
        }
        catch(error){
            console.log(error.message)
            responseReturn(res,400,{error: error.message})
        }
    };

    fetchMyNetaData = async (req,res) => {
        const {minister,constituency} = req.body
        console.log(minister,constituency)

        // const qs = `${query} prs`
        // console.log(`🔎 [fetchImageFromSerpAPI] Searching image for: "${query}"`);
        
        try{
            const endPoint = `http://0.0.0.0:8000/scrape-myneta`;
            const result = await axios.post(endPoint,{ minister, constituency });
            console.log(result.data);
            responseReturn(res,200,{data: result.data})
        }
        catch(error){
            console.log(error.message)
            responseReturn(res,400,{error: error.message})
        }
    };


    scrapeMinisterData = async (req,res) => {
        const {minister, constituency} = req.body;
        console.log(minister)
        const query = minister;
        const now = new Date();
        const twoHourAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        let mpId;
        const MP = await loksabhaMpModel.findOne({ name: minister })
        mpId = MP._id
        console.log(mpId,MP)
        if (!minister||!mpId) {
            return res.status(400).json({ error: 'Missing query' });
        }
        try{
            let lokmp = await loksabhaMPDataModel.findOne({politician: mpId});
            if(!lokmp){
                lokmp = await loksabhaMPDataModel.create({
                    politician: mpId,
                    politicianName: minister
                })
            }
            const endPoint = `http://0.0.0.0:8000/scrape-myneta`;
            const prsData = await axios.post(endPoint,{ minister, constituency });
            console.log(prsData.data);
            const endPointDeb = `http://0.0.0.0:8000/scrape-deb`;
            const myNetaData = await axios.post(endPointDeb,{ minister, constituency });
            console.log(myNetaData.data.results);
            const updatedDoc = await loksabhaMPDataModel.findOneAndUpdate(
                { politicianName: minister }, // Find by name
                {
                    $set: {
                    debates: myNetaData.data.results,
                    criminalCases: prsData.data.result.criminal_cases,
                    assetsData: prsData.data.result.data_table,
                    }
                },
                { new: true } // Return the updated document
                );

            responseReturn(res,200,{final: updatedDoc})
        }
        catch(error){
            console.log(error);
            responseReturn(res,200,{error: error.message})
        }        

    };

    

    scrapeAllMinisterData = async (req, res) => {
    try {
        const results = [];

        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        for (const mp of mpLokSabhaData) {
            const minister = mp.mp_name;
            const constituency = mp.pc_name;

            console.log(`Scraping data for ${minister} (${constituency})`);

            const MP = await loksabhaMpModel.findOne({ name: minister });
            if (!MP) {
                console.warn(`MP not found in DB: ${minister}`);
                continue;
            }

            let lokmp = await loksabhaMPDataModel.findOne({ politicianName: minister });
            if(lokmp){
                console.log("skipping");
                continue;
            }

            if (!lokmp) {
                lokmp = await loksabhaMPDataModel.create({
                    politician: MP._id,
                    politicianName: minister,
                });
            }

            try {
                const prsRes = await axios.post(`http://0.0.0.0:8000/scrape-myneta`, {
                    minister,
                    constituency,
                });

                // await sleep(5000);

                // const debRes = await axios.post(`http://0.0.0.0:8000/scrape-deb`, {
                //     minister,
                //     constituency,
                // });

                const updatedDoc = await loksabhaMPDataModel.findOneAndUpdate(
                    { politicianName: minister },
                    {
                        $set: {
                            // debates: debRes?.data?.results || [],
                            criminalCases: prsRes?.data?.result?.criminal_cases || "",
                            assetsData: prsRes?.data?.result?.data_table || [],
                        },
                    },
                    { new: true }
                );

                results.push({
                    minister,
                    status: "success",
                    data: updatedDoc,
                });

            } catch (innerErr) {
                console.error(`Failed for ${minister}:`, innerErr.message);
                results.push({
                    minister,
                    status: "error",
                    error: innerErr.message,
                });
            }
            // await sleep(2000);
        }

        return responseReturn(res, 200, { summary: results });
    } catch (err) {
        console.error("Unexpected error:", err);
        return responseReturn(res, 500, { error: "Internal Server Error" });
    }
};


    


}

module.exports = new geoControllers()