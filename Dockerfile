FROM phusion/baseimage:0.9.16

CMD ["/sbin/my_init"]

RUN curl -sL https://deb.nodesource.com/setup | sudo bash -
#RUN sudo apt-get update
RUN sudo apt-get install nodejs -y
RUN sudo apt-get install git -y

#RUN useradd docker && echo "docker:docker" | chpasswd
#RUN mkdir -p /home/docker && chown -R docker:docker /home/docker

WORKDIR /home/docker

RUN npm install -g bower

EXPOSE 3000

ADD package.json /home/docker/package.json
ADD bower.json /home/docker/bower.json


RUN npm install
RUN bower install --allow-root -y

ADD server/package.json /home/docker/server/package.json
RUN cd server && npm install

ADD . /home/docker

RUN cp -rf /home/docker/bower_components /home/docker/app/bower_components
#COPY /home/docker/bower_components app/bower_components

#RUN npm install -g grunt-cli
#RUN grunt


#RUN node server/app.js
#RUN node mongotest/app.js

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*