FROM phusion/baseimage:0.9.16

CMD ["/sbin/my_init"]

RUN curl -sL https://deb.nodesource.com/setup | sudo bash -
RUN sudo apt-get install nodejs -y
RUN sudo apt-get install git -y

EXPOSE 3000

WORKDIR /home/docker

RUN npm install -g bower

ADD package.json /home/docker/package.json
ADD bower.json /home/docker/bower.json

RUN npm install
RUN bower install --allow-root -y

ADD server/package.json /home/docker/server/package.json
RUN cd server && npm install

ADD . /home/docker

RUN cp -rf /home/docker/bower_components /home/docker/app/bower_components

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*