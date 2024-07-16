
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