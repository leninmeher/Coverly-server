const express = require('express');
const mongoose = require('mongoose');
const app = express();
const User = require('./model/User');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');

app.use(express.json());
app.use(cors());

const gemini_api_key = process.env.GOOGLE_GEMINI_API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiConfig = {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    geminiConfig,
});

const uri = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
        });
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

connectDB();

app.get('/get-user', async (req, res) => {

    if (!req.query.email) {
        return res.status(200)
            .json({
                success: false,
                error: 'Please enter your email'
            })
    }

    const user = await User.findOne({ email: req.query.email });

    if (user) {
        return res.status(200)
            .json({
                success: true,
                data: user
            })
    } else {
        return res.status(200)
            .json({
                success: false,
                error: "No user found",
            })
    }
})

app.post('/create-user', async (req, res) => {

    if (!req.body.name || !req.body.email) {
        return res.status(200)
            .json({
                success: false,
                error: 'Please enter compulsory fields'
            })
    }

    const user = await User.findOne({ email: req.body.email });

    if (user) {
        await User.findOneAndUpdate({ email: req.body.email }, { $set: { resumeName: req.body.resumeName, name: req.body.name } }, { new: false })
            .then((updatedUser) => {
                if (!updatedUser) return res.status(200)
                    .json({
                        success: false,
                        error: "User creation failed"
                    })
                res.status(200)
                    .json({
                        success: true,
                        data: updatedUser
                    })
            })
            .catch((error) => {
                res.status(500)
                    .json({
                        success: false,
                        error: error.message
                    })
            })
    } else {

        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            resumeName: req.body.resumeName,
            resumeData: req.body.resumeData
        });

        await User.create(newUser)
            .then((createdUser) => {
                if (!createdUser) return res.status(200)
                    .json({
                        success: false,
                        error: "User creation failed"
                    })
                res.status(201)
                    .json({
                        success: true,
                        data: createdUser
                    })
            })
            .catch((error) => {
                res.status(500)
                    .json({
                        success: false,
                        error: error.message
                    })
            })
    }
})

app.post('/add-resume', async (req, res) => {

    if (!req.body.resumeData || !req.body.email) {
        return res.status(200)
            .json({
                success: false,
                error: 'Please add your resume'
            })
    }


    await User.findOneAndUpdate({ email: req.body.email }, { $set: { resumeName: req.body.resumeName, resumeData: req.body.resumeData } }, { new: false })
        .then((updatedUser) => {
            if (!updatedUser) return res.status(200)
                .json({
                    success: false,
                    error: "User creation failed"
                })
            res.status(200)
                .json({
                    success: true,
                    data: updatedUser
                })
        })
        .catch((error) => {
            res.status(500)
                .json({
                    success: false,
                    error: error.message
                })
        })
})

app.post('/generate-cover-letter', async (req, res) => {
    if (!req.body.email) {
        return res.status(200)
            .json({
                success: false,
                error: 'Please add your email'
            })
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user.resumeData || user.resumeData == "") {
        return res.status(200)
            .json({
                success: false,
                error: 'Please add your Resume'
            })
    }

    try {
        const prompt = `Generate a cover letter based on the following job description and my resume:\n\nJob Description:\n${ req.body.jobDescription }, \n\nResume:\n${ user.resumeData }`;
        const result = await geminiModel.generateContent(prompt);
        const response = result.response;
        return res.status(200)
            .json({
                success: true,
                data: response
            })
    } catch (error) {
        console.log('response error', error);
        return res.status(500)
            .json({
                success: false,
                error: error
            })
    }
})

app.post('/generate-cold-mail', async (req, res) => {
    if (!req.body.email) {
        return res.status(200)
            .json({
                success: false,
                error: 'Please add your email'
            })
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user.resumeData || user.resumeData == "") {
        return res.status(200)
            .json({
                success: false,
                error: 'Please add your Resume'
            })
    }

    try {
        const prompt = `Generate a very short and crisp within 100 words cold email to the recruiter based on the following job description and my resume:\n\nJob Description:\n${ req.body.jobDescription }, \n\nResume:\n${ user.resumeData }`;
        const result = await geminiModel.generateContent(prompt);
        const response = result.response;
        return res.status(200)
            .json({
                success: true,
                data: response
            })
    } catch (error) {
        console.log('response error', error);
        return res.status(500)
            .json({
                success: false,
                error: error
            })
    }
})


app.listen(8000, () => {
    console.log("server started");
});