// taken from https://github.com/nathvarun/Expo-Stripe-Tutorial
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// app.use(
//   cors({
//     origin: "http://localhost:3000",
//   })
// );

app.use(
  cors({
    origin: "https://getfulfil.com",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

//for testing, remove when done
app.listen(80);
// const port = 3000; //add your port here

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import Stripe from "stripe";
import { log } from "util";

const stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

// const stripe = Stripe(process.env.STRIPE_TEST_KEY, {
//   apiVersion: "2022-08-01",
// });

console.log("hello");

app.post("/create-payment-intent", async (req, res) => {
  console.log("this is body", req.body);

  //help from https://www.youtube.com/@cjav_dev

  const setPrice = req.body.price;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: setPrice, //lowest denomination of particular currency
      currency: "usd",
      payment_method_types: ["card"], //by default
    });

    const clientSecret = paymentIntent.client_secret;

    // res.json("this is the body")

    res.json({
      clientSecret: clientSecret,
    });
  } catch (e) {
    console.log(e.message);
    res.json({ error: e.message });
  }
});

app.post("/test", async (req, res) => {
  // const { body } = req
  console.log("test complete");
  // console.log(req.body);
});

app.post("/create-stripe-account-web", async (req, res) => {
  // console.log("coming through?",req)

  try {
    //create account... help from https://www.youtube.com/@cjav_dev

    const account = await stripe.accounts.create({
      country: "US",
      type: "express",
      capabilities: {
        card_payments: {
          requested: true,
        },

        transfers: {
          requested: true,
        },

        tax_reporting_us_1099_k: {
          requested: true,
        },
      },
    });

    //create account link
    // return_url: "http://localhost:3001/DoerAccountManager",
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://getfulfil.com/DoerAccountManager",
      return_url: "https://getfulfil.com/DoerAccountManager",
      type: "account_onboarding",
    });

    res.json({
      accountLink: accountLink,
      accountID: account.id,
    });
    console.log(JSON.stringify(accountLink));
    console.log(JSON.stringify(account.id));
    console.log(JSON.stringify(account));
    console.log("hit");
  } catch (err) {
    console.log(err);
    res.send({ error: err });
  }
});

app.post("/create-stripe-account", async (req, res) => {
  // console.log("coming through?",req)
  try {
    //create account... help from https://www.youtube.com/@cjav_dev

    const account = await stripe.accounts.create({
      country: "US",
      type: "express",
      capabilities: {
        card_payments: {
          requested: true,
        },

        transfers: {
          requested: true,
        },

        tax_reporting_us_1099_k: {
          requested: true,
        },
      },
    });

    //took this out of creat-stripe-account
    // settings: {
    //   payouts: {
    //     schedule: {
    //       interval: "manual",
    //     },
    //   },
    // },

    //create account link

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://main--courageous-begonia-a876a4.netlify.app/",
      return_url: "https://main--courageous-begonia-a876a4.netlify.app/",
      type: "account_onboarding",
    });

    res.json({
      accountLink: accountLink,
      accountID: account.id,
    });
    // console.log(JSON.stringify(accountLink));
    // console.log(JSON.stringify(account.id));
    // console.log(JSON.stringify(account));
    console.log("hit");
  } catch (err) {
    console.log(err);
    res.send({ error: err });
  }
});

//test oush

//verify stripe account is complete
app.post("/verify-stripe-account", async (req, res) => {
  //consume accountID from FB
  //muted one was for mobile, live one is web
  // const stripeID = req.body.id;

  //this one is for web
  const stripeID = req.body.stripeID;
  console.log("stripe id from server", req.body.stripeID);

  const account = await stripe.accounts.retrieve(stripeID);

  console.log("account from verification", account);
  console.log(
    "this is to check if account is verified payments",
    account.charges_enabled
  );
  console.log(
    "this is to check if account is verified payments",
    account.payouts_enabled
  );

  res.json({
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });
});

const testPrice = { price: 1000 };

//help from https://www.youtube.com/@cjav_dev

app.post("/create-checkout", async (req, res) => {
  console.log("This is the job info", req.body);

  const hiredApplicantStripeID = req.body[0].workerStripeID;
  const confirmedPrice = parseInt(req.body[1].confirmedPrice);
  // const applicationFee = req.body[2].applicationFee;
  const applicationFee = parseInt(req.body[1].confirmedPrice * 0.13);
  const doerUID = req.body[2].doerUID;
  const jobID = req.body[3].jobID;
  const neederUID = req.body[4].neederUID;

  console.log(applicationFee, confirmedPrice);

  try {
    const session = await stripe.checkout.sessions.create({
      success_url: "https://shimmering-snickerdoodle-9c6d0b.netlify.app/",
      cancel_url: "https://shimmering-snickerdoodle-9c6d0b.netlify.app/",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Provided",
            },
            unit_amount: confirmedPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        confirmedPrice: confirmedPrice,
        doerUID: doerUID,
        neederUID: neederUID,
        jobID: jobID,
      },
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: hiredApplicantStripeID,
        },
      },
    });

    // return session

    console.log(session.url);

    res.json({ session: session });
  } catch (err) {
    console.log("error Im looking for", err);
    res.json({ error: err });
  }
});

app.post("/create-checkout-web", async (req, res) => {
  // console.log("This is the job info", req);

  const hiredApplicantStripeID = req.body[0].workerStripeID;
  const confirmedPrice = parseInt(req.body[1].confirmedPrice);
  // const applicationFee = req.body[2].applicationFee;
  const applicationFee = parseInt(req.body[1].confirmedPrice * 0.13);
  const doerUID = req.body[2].doerUID;
  const jobID = req.body[3].jobID;
  const neederUID = req.body[4].neederUID;

  console.log(applicationFee, confirmedPrice);

  try {
    const session = await stripe.checkout.sessions.create({
      success_url:
        "https://getfulfil.com/NeederPaymentComplete/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://getfulfil.com/NeederInReviewList",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Provided",
            },
            unit_amount: confirmedPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        confirmedPrice: confirmedPrice,
        doerUID: doerUID,
        neederUID: neederUID,
        jobID: jobID,
      },
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: hiredApplicantStripeID,
        },
      },
    });

    // return session

    console.log(session.url);

    res.json({ session: session });
  } catch (err) {
    console.log("error Im looking for", err);
    res.json({ error: err });
  }
});

app.post("/create-checkout-web-embedded", async (req, res) => {
  console.log("This is the job info", req.body);

  const hiredApplicantStripeID = req.body[0].workerStripeID;
  const confirmedPrice = parseInt(req.body[1].confirmedPrice);
  // const applicationFee = req.body[2].applicationFee;
  const applicationFee = parseInt(req.body[1].confirmedPrice * 0.13);
  const doerUID = req.body[2].doerUID;
  const jobID = req.body[3].jobID;
  const neederUID = req.body[4].neederUID;
  const jobTitle = req.body[5].jobTitle;

  console.log(applicationFee, confirmedPrice);

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",

      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Provided",
            },
            unit_amount: confirmedPrice,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        confirmedPrice: confirmedPrice,
        doerUID: doerUID,
        neederUID: neederUID,
        jobID: jobID,
        jobTitle: jobTitle,
      },
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: hiredApplicantStripeID,
        },
      },
      return_url:
        "https://getfulfil.com/NeederPaymentComplete/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    console.log(session.client_secret);
  } catch (err) {
    console.log("error Im looking for", err);
    res.json({ error: err });
  }
});

app.get("/session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  console.log("hirt");
  res.send({
    userID: session.metadata.neederUID,
    jobTitle: session.metadata.jobTitle,
    status: session.status,
    customer_email: session.customer_details.email,
    confirmedPrice: session.metadata.confirmedPrice,
  });
});

app.get("/single-post-session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  console.log("single post hit", session.status);
  res.send({
    status: session.status,
  });
});

app.post("/stripe-log-in", async (req, res) => {
  const stripeID = req.body.stripeID;
  console.log("stripe id from server", req.body.stripeID);

  const loginLink = await stripe.accounts.createLoginLink(stripeID);

  res.send({
    loginLink: loginLink.url,
  });
  console.log("server data", loginLink);
});

app.post("/check-payment-status", async (req, res) => {
  console.log("its hitting", req.body.paymentId);
  const checkoutSessionID = req.body.paymentId;
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionID);

  res.json({ session: session });
});

//credit / help from https://github.com/pagecow/stripe-subscribe-payments
app.post("/create-subscription-session", async (req, res) => {
  console.log("got em");
  try {
    const session = await stripe.checkout.sessions.create({
      success_url: "https://getfulfil.com/DoerSubscriptionComplete",
      cancel_url: "https://getfulfil.com/DoerMapScreen",
      line_items: [
        {
          price: "price_1P6eBoGOViWTUZKUttCMySKJ",
          quantity: 1,
        },
      ],
      mode: "subscription",
    });
    console.log("session: ", session.id, session.url, session);

    // get id, save to user, return url
    const sessionId = session.id;
    console.log("sessionId: ", sessionId);

    // save session.id to the user in your database
    res.json({ session: session });

    //original
    // res.json({ url: session.url })
  } catch (e) {
    res.status(500).json({ error: e.message });
    console.log(e);
  }
});

app.post("/check-subscription-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.body.sessionID);

  res.send({
    status: session.status,
    customer_email: session.customer_details.email,
  });
});

app.post("/create-checkout-single-post", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",

      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1PQFV9GOViWTUZKUXyV3F2uB",
          quantity: 1,
        },
      ],
      mode: "payment",
      return_url:
        "https://getfulfil.com/Homepage/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    // console.log(session.client_secret);
  } catch (err) {
    console.log("error Im looking for", err);
    res.json({ error: err });
  }
});

app.post("/create-business-subscription-session", async (req, res) => {
  console.log("create subscription back end");

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",

      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1PbRUDGOViWTUZKU2VPkZkT4",
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        trial_period_days: 30,
      },
      return_url:
        "https://getfulfil.com/Homepage/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    // console.log(session.client_secret);
  } catch (err) {
    console.log("error Im looking for", err);
    res.json({ error: err });
  }
});

app.post("/create-business-subscription-session-starter", async (req, res) => {
  console.log("create subscription back end");

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1PbRTeGOViWTUZKU9N1aVkeA",
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        trial_period_days: 30,
      },
      return_url:
        "https://getfulfil.com/Homepage/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    console.log(session.client_secret);
  } catch (err) {
    console.log("error Im looking for", err);
    res.json({ error: err });
  }
});

app.get("/business-subscription-session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  console.log("business hit", session.status);

  //LIVE
  res.send({
    status: session.status,
  });

  // TEST
  // res.send({
  //   status: "complete",
  // });
});

app.post("/create-doer-free-trial", async (req, res) => {
  console.log("create subscription back end");

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",

      payment_method_types: ["card"],
      line_items: [
        {
          //test price id price_1QFeEiGOViWTUZKUw46EuVEQ
          price: "price_1QFUGGGOViWTUZKUhqjLgjui",
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
        trial_period_days: 30,
      },
      return_url:
        "https://getfulfil.com/DoerFreeTrial/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    console.log(session.client_secret);
  } catch (err) {
    console.log("error individual monthly", err);
    res.json({ error: err });
  }
});

app.post("/create-individual-subscription-monthly", async (req, res) => {
  console.log("create subscription back end");

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",

      payment_method_types: ["card"],
      line_items: [
        {
          //test price id price_1QFeEiGOViWTUZKUw46EuVEQ
          price: "price_1QFUGGGOViWTUZKUhqjLgjui",
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
      },
      return_url:
        "https://getfulfil.com/DoerMapView/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    console.log(session.client_secret);
  } catch (err) {
    console.log("error individual monthly", err);
    res.json({ error: err });
  }
});

app.get("/doer-monthly-subscription-session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  console.log("business hit", session.status);

  //LIVE
  res.send({
    status: session.status,
  });

  // TEST
  // res.send({
  //   status: "complete",
  // });
});

app.post("/create-individual-subscription-annual", async (req, res) => {
  console.log("create subscription back end");

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",

      payment_method_types: ["card"],
      line_items: [
        {
          //test price id price_1QFeEiGOViWTUZKUw46EuVEQ
          price: "price_1QG1XHGOViWTUZKUGxFoLvGf",
          quantity: 1,
        },
      ],
      mode: "subscription",
      subscription_data: {
        trial_settings: {
          end_behavior: {
            missing_payment_method: "cancel",
          },
        },
      },
      return_url:
        "https://getfulfil.com/DoerPayment/?session_id={CHECKOUT_SESSION_ID}",
    });

    //test
    res.send({ clientSecret: session.client_secret });

    // return session
    // res.send({clientSecret: session.client_secret});

    console.log(session.client_secret);
  } catch (err) {
    console.log("error individual annual", err);
    res.json({ error: err });
  }
});

app.get("/doer-annual-subscription-session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);


  //LIVE
  res.send({
    status: session.status,
  });

  // TEST
  // res.send({
  //   status: "complete",
  // });
});