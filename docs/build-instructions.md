# Build-Instructions

Welcome to see the build instructions for the ehsm-kms project.


## Quick start with Docker-Compose
**Notes:** The below steps has been verified on the **Ubuntu-20.04**. <br>

* Install requirement tools
    ``` shell
    sudo apt update

    sudo apt install vim autoconf automake build-essential cmake curl debhelper git libcurl4-openssl-dev libprotobuf-dev libssl-dev libtool lsb-release         ocaml ocamlbuild protobuf-compiler wget libcurl4 make g++ fakeroot libelf-dev libncurses-dev flex bison libfdt-dev libncursesw5-dev pkg-config             libgtk-3-dev libspice-server-dev libssh-dev python3 python3-pip  reprepro unzip libjsoncpp-dev uuid-dev
    wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_amd64.deb
    sudo dpkg -i libssl1.1_1.1.0g-2ubuntu4_amd64.deb
    ```

* Install SGX SDK
    ```shell
    wget https://download.01.org/intel-sgx/sgx-linux/2.16/as.ld.objdump.r4.tar.gz 
    tar -zxf as.ld.objdump.r4.tar.gz
    sudo cp external/toolset/{current_distr}/* /usr/local/bin
    
    wget https://download.01.org/intel-sgx/sgx-dcap/1.13/linux/distro/ubuntu20.04-server/sgx_linux_x64_sdk_2.16.100.4.bin

    #choose to install the sdk into the /opt/intel
    chmod a+x ./sgx_linux_x64_sdk_2.16.100.4.bin && sudo ./sgx_linux_x64_sdk_2.16.100.4.bin

    source /opt/intel/sgxsdk/environment
    ```

* Install DCAP required packages
    ```shell
    cd /opt/intel

    wget https://download.01.org/intel-sgx/sgx-dcap/1.13/linux/distro/ubuntu20.04-server/sgx_debian_local_repo.tgz

    tar xzf sgx_debian_local_repo.tgz

    echo 'deb [trusted=yes arch=amd64] file:///opt/intel/sgx_debian_local_repo focal main' | sudo tee /etc/apt/sources.list.d/intel-sgx.list

    wget -qO - https://download.01.org/intel-sgx/sgx_repo/ubuntu/intel-sgx-deb.key | sudo apt-key add -

    sudo apt-get update

    sudo apt-get install -y libsgx-enclave-common-dev  libsgx-ae-qe3 libsgx-ae-qve libsgx-urts libsgx-dcap-ql libsgx-dcap-default-qpl libsgx-dcap-quote-verify-dev libsgx-dcap-ql-dev libsgx-dcap-default-qpl-dev libsgx-quote-ex-dev libsgx-uae-service libsgx-ra-network libsgx-ra-uefi
    ```

* Change PCCS server IP
    ``` shell
    vim /etc/sgx_default_qcnl.conf
    ```
    ``` vi
    # PCCS server address
    PCCS_URL=https://1.2.3.4:8081/sgx/certification/v3/ (your pccs IP)

    # To accept insecure HTTPS certificate, set this option to FALSE
    USE_SECURE_CERT=FALSE
    ```

* Install docker-compose
    ``` shell
    # Download the current stable release (remove the "-x $http_proxy" if you don't behind the proxy)
    sudo curl -x $http_proxy -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

    sudo chmod +x /usr/local/bin/docker-compose

    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

    docker-compose --version
    # docker-compose version 1.29.2, build 5becea4c
    ```

* Build and Run ehsm-kms with docker-compose
    ```shell
    # Download the ehsm code from github
    git clone --recursive https://github.com/intel/ehsm.git ehsm && cd ehsm

    vim docker/.env
    # Modify the docker/.env configurations
    HOST_IP=1.2.3.4               # MUST modify it to your host IP.

    PCCS_URL=https://1.2.3.4:8081 # MUST modify it to your pccs server url.

    DKEYSERVER_PORT=8888          # (Optional) the default port of dkeyserver, modify it if you want.
    KMS_PORT=9000                 # (Optional) the default KMS port, modify it if you want.

    TAG_VERSION=main              # (Optional) the default code base is using the main latest branch, modify it to specific tag if you want.

    # start to build and run the docker images (couchdb, dkeyserver, dkeycache, ehsm_kms_service)
    cd docker && docker-compose up -d
    ```
    You will get below results:<br>
    ![image](diagrams/docker-compose-result.PNG)

* Enrollment of the APPID and APIKey
    * Option-1: use the RESTFUL GET command of Enroll
    ``` shell
    curl [--insecure] https://1.2.3.4:9000/ehsm?Action=Enroll
    ```
    ![image](diagrams/enroll.PNG)

    * Option-2: use the enroll_app which will remote attest the eHSM-KMS
    ``` shell
    # build the enroll application
    cd enroll_app
    make

    # use the enroll app to retrieve the valide appid and apikey from ehsm-kms
    cd ../out/ehsm-kms_enroll_app
    ./ehsm-kms_enroll_app -a https://1.2.3.4:9000/ehsm/ [-n] (change to your ip and port, optional -n used for tested web certificate)
    ```
    You will get below results:<br>
    ![image](diagrams/enroll_result.PNG)

* Run the unittest cases (you can do it in another remote device)
    * Test with python script
    ``` shell
    cd test
    # run the unit testcases
    python3 test_kms_with_cli.py --url https://<ip_addr>:<port>
    ```
    Then, you will get the below test result:<br>
    ![unittest-result-with-rest.png](diagrams/unittest-result-with-rest.PNG)


**Notes:**
If you want to deploy the ehsm-kms service into the K8S environment, please refer to the doc [deployment-instructions](deployment-instructions.md).

