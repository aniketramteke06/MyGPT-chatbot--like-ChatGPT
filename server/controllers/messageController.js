import axios from "axios"
import Chat from "../models/Chat.js";
import User from "../models/User.js"
import imagekit from "../configs/imageKit.js"
import openai from '../configs/openai.js'



//text-based AI chat message controller
export const textMessageController = async (req, res) => {
    try{
        const userId = req.user._id
        if(req.user.credits<1){
            return res.json({success:false,message:"you don't have enough credits to use this feature "})
        }

        const {chatId, prompt} = req.body

        const chat = await Chat.findOne({userId,_id:chatId})
        chat.messages.push({role: "user", content : prompt,timestamp:Date.now(), isImage: false})
        const {choices} = await openai.chat.completions.create({
                model: "gemini-2.5-flash",
                reasoning_effort: "low",
                messages: [
                            {
                                 role: "user",
                                    content: prompt ,
                            },
                         ],
                            });
        const reply = {...choices[0].message,timestamp:Date.now(),isImage:false}
        res.json({success:true,reply})

        chat.messages.push(reply)
        await chat.save()
        await User.updateOne({_id:userId},{$inc:{credits:-1}})
        
    }catch(error){
        res.json({success:false,message:error.message})
    }
}

//Image generation message Controller
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // check credits
    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "You don't have enough credits to use this feature",
      });
    }

    const { prompt, chatId, isPublished } = req.body;

    // find chat
    const chat = await Chat.findOne({ userId, _id: chatId });
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found" });
    }

    // push user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // encode the prompt
    const encodedPrompt = encodeURIComponent(prompt);

    // construct ImageKit AI generation URL
    const generateImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;

    // trigger generation by fetching from ImageKit
    const aiImageResponse = await axios.get(generateImageUrl, {
      responseType: "arraybuffer",
    });

    // convert to base64
    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    // upload to ImageKit media library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "quickgpt",
    });

    // prepare reply
    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };

    // send response
    res.json({ success: true, reply });

    // save chat
    chat.messages.push(reply);
    await chat.save();

    // decrease credits
    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};