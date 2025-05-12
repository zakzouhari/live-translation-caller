const express = require('express');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH;
const client = twilio(accountSid, authToken);

const personA = process.env.PERSON_A;
const personB = process.env.PERSON_B;
const TRANSLATION_WS = process.env.TRANSLATION_WS;
const PUBLIC_URL = process.env.PUBLIC_URL;

app.use(express.urlencoded({ extended: false }));

// Twilio will hit this when each person answers
app.post('/voice', (req, res) => {
  const response = new twilio.twiml.VoiceResponse();

  response.start().stream({ url: TRANSLATION_WS });

  const dial = response.dial();
  dial.conference('LiveTranslateRoom');

  res.type('text/xml');
  res.send(response.toString());
});

// You visit this to trigger the 3-way call
app.get('/start-call', async (req, res) => {
  try {
    // Ensure the URL has no space or trailing slash issues
    const voiceUrl = PUBLIC_URL.replace(/\/+$/, '') + '/voice';

    console.log('Calling:', personA, personB);
    console.log('Using TwiML URL:', voiceUrl);

    const callA = await client.calls.create({
      url: voiceUrl,
      to: personA,
      from: process.env.TWILIO_PHONE,
    });

    const callB = await client.calls.create({
      url: voiceUrl,
      to: personB,
      from: process.env.TWILIO_PHONE,
    });

    console.log('Call A SID:', callA.sid);
    console.log('Call B SID:', callB.sid);

    res.send('Calls initiated to both participants!');
  } catch (err) {
    console.error('Twilio Call Error:', err);
    res.status(500).send(`Call initiation failed: ${err.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
