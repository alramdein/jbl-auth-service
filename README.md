
# Setup
1. Copy `.env.example` and rename it to `.env`. Make sure all the credentials are correct. 
    > Please note that if you want to run it on Docker, make sure the `mongo host` is the 
    > same as in the docker-compose. In this case it must be `mongo`
2. Make sure you've created `jubelio_networks` network
    ```
    docker network create jubelio_networks
    ```

# How To Run
```
docker-compose up
```

# Setup for email notification
For email notification sender env
```
EMAIL=
EMAIL_PASSWORD=
```
If you use `gmail`, please turn on 2-Step Verification and generate the `app password`. Here is the step:
1. Go to your Google account at https://myaccount.google.com/
2. Go to Security
3. Choose 2-Step Verification - here you have to verify yourself, in my case it was with phone number and a confirmation code send as text message. After that you will be able to enabled 2-Step Verification
4. Visit https://myaccount.google.com/apppasswords to create your app.
5. Put a name e.g. nodemailer to your app and create it.
6. A modal dialog will appear with the password. Get that password and use it in your code.

