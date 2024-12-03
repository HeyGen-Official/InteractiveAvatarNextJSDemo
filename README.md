# HeyGen Interactive Avatar NextJS Demo

![HeyGen Interactive Avatar NextJS Demo Screenshot](./public/demo.png)

This is a sample project and was bootstrapped using [NextJS](https://nextjs.org/).
Feel free to play around with the existing code and please leave any feedback for the SDK [here](https://github.com/HeyGen-Official/StreamingAvatarSDK/discussions).

## Getting Started FAQ

### Setting up the demo

1. Clone this repo

2. Navigate to the repo folder in your terminal

3. Run `npm install` (assuming you have npm installed. If not, please follow these instructions: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)

4. Enter your HeyGen Enterprise API Token or Trial Token in the `.env` file. Replace `HEYGEN_API_KEY` with your API key. This will allow the Client app to generate secure Access Tokens with which to create interactive sessions.

   You can retrieve either the API Key or Trial Token by logging in to HeyGen and navigating to this page in your settings: [https://app.heygen.com/settings?nav=API]. NOTE: use the trial token if you don't have an enterprise API token yet.

5. (Optional) If you would like to use the OpenAI features, enter your OpenAI Api Key in the `.env` file.

6. Run `npm run dev`

### Difference between Trial Token and Enterprise API Token

The HeyGen Trial Token is available to all users, not just Enterprise users, and allows for testing of the Interactive Avatar API, as well as other HeyGen API endpoints.

Each Trial Token is limited to 3 concurrent interactive sessions. However, every interactive session you create with the Trial Token is free of charge, no matter how many tasks are sent to the avatar. Please note that interactive sessions will automatically close after 10 minutes of no tasks sent.

If you do not 'close' the interactive sessions and try to open more than 3, you will encounter errors including stuttering and freezing of the Interactive Avatar. Please endeavor to only have 3 sessions open at any time while you are testing the Interactive Avatar API with your Trial Token.

### Starting sessions

NOTE: Make sure you have enter your token into the `.env` file and run `npm run dev`.

To start your 'session' with a Interactive Avatar, first click the 'start' button. If your HeyGen API key is entered into the Server's .env file, then you should see our demo Interactive Avatar (Monica!) appear.

After you see Monica appear on the screen, you can enter text into the input labeled 'Repeat', and then hit Enter. The Interactive Avatar will say the text you enter.

If you want to see a different Avatar or try a different voice, you can close the session and enter the IDs and then 'start' the session again. Please see below for information on where to retrieve different Avatar and voice IDs that you can use.

### Which Avatars can I use with this project?

By default, there are several Public Avatars that can be used in Interactive Avatar. (AKA Interactive Avatars.) You can find the Avatar IDs for these Public Avatars by navigating to [app.heygen.com/interactive-avatar](https://app.heygen.com/interactive-avatar) and clicking 'Select Avatar' and copying the avatar id.

In order to use a private Avatar created under your own account in Interactive Avatar, it must be upgraded to be a Interactive Avatar. Only 1. Finetune Instant Avatars and 2. Studio Avatars are able to be upgraded to Interactive Avatars. This upgrade is a one-time fee and can be purchased by navigating to [app.heygen.com/interactive-avatar] and clicking 'Select Avatar'.

Please note that Photo Avatars are not compatible with Interactive Avatar and cannot be used.

### Where can I read more about enterprise-level usage of the Interactive Avatar API?

Please read our Interactive Avatar 101 article for more information on pricing and how to increase your concurrent session limit: https://help.heygen.com/en/articles/9182113-interactive-avatar-101-your-ultimate-guide
