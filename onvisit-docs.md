## D2 Tour | D2 Documentation

URL: https://d2lang.com/tour/intro/

D2 is a diagram scripting language that turns text to diagrams. It stands for

**D2** is a diagram scripting language that turns text to diagrams. It stands for **Declarative Diagramming**. Declarative, as in, you describe what you want diagrammed, it generates the image.

For example, download the CLI, create a file named `input.d2`, copy paste the following, run this command, and you get the image below.

```
d2 --theme=300 --dark-theme=200 -l elk --pad 0 ./input.d2
```

NETWORKUSERAPI SERVERLOGSCELL TOWERONLINE PORTALDATA PROCESSORSATELLITESTRANSMITTERUISTORAGE SENDSENDSENDPHONE LOGSMAKE CALL ACCESSDISPLAYPERSIST

```
vars: {
 d2-config: {
   layout-engine: elk
   # Terminal theme code
   theme-id: 300
 }
}
network: {
 cell tower: {
   satellites: {
     shape: stored_data
     style.multiple: true
   }

   transmitter

   satellites -> transmitter: send
   satellites -> transmitter: send
   satellites -> transmitter: send
 }

 online portal: {
   ui: {shape: hexagon}
 }

 data processor: {
   storage: {
     shape: cylinder
     style.multiple: true
   }
 }

 cell tower.transmitter -> data processor.storage: phone logs
}

user: {
 shape: person
 width: 130
}

user -> network.cell tower: make call
user -> network.online portal.ui: access {
 style.stroke-dash: 3
}

api server -> network.online portal.ui: display
api server -> logs: persist
logs: {shape: page; style.multiple: true}

network.data processor -> api server
```

###### Using the CLI watch mode[​](#using-the-cli-watch-mode)

![D2 CLI](https://d2lang.com/assets/images/cli-d53efad8a27f22b9520d9cd7dc9658d1.gif)

You can finish this tour in about 5-10 minutes, and at the end, there's a cheat sheet you can download and refer to. If you want just the bare essentials, [Getting Started](https://d2lang.com/tour/hello-world) takes ~2 mins.

info

For each D2 snippet, you can hover over it to open directly in the Playground and tinker.

There's some exceptions like snippets that use imports.

---
