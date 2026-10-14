---
title: "I Built a Desktop App with Both Tauri and Electron"
date: 2026-10-14
pinned: false
description: ""
slug: "tauri-vs-electron"
tags:
  - dev
  - javascripte
content_language: "en"
selected: false
# external_url: ""
draft: false
---
When it comes to desktop apps, I’m a native-first person. I like software that feels like it belongs on the OS it runs on. I’d rather use the platform’s native stack than put a web UI inside a desktop shell.
That said, native development gets expensive once you want to support multiple platforms. So yeah, I get why companies go for Electron. But honestly, I still hate it.
From a developer point of view, I’m not a fan of shipping Chromium with every desktop app. That’s what made Tauri interesting to me.

## Local Woman Meets Tauri
Tauri keeps the part I actually like about Electron. It uses web technologies to build a cross-platform UI. The difference is that it doesn’t bundle Chromium with the app. It uses the system WebView, while native functionality lives on the Rust side.

And this was also my first time actually using Rust. Coming from languages where you can make a mess first and negotiate with yourself about fixing it later, Rust felt strict from day one. But I got used to it surprisingly quickly.

In Tauri, the frontend handles the interface, and Rust handles the native side. You don’t need much Rust for a simple app, so it turned out to be a pretty comfortable introduction to the language. And, well, it’s 2026; there’s always an AI nearby to help.

## The Obvious Win
Electron bundles Chromium and Node.js with your application. Even a tiny desktop tool brings its own browser runtime along for the ride. That’s quite a suitcase for an app with three buttons.

Tauri uses a separate WebView runtime (WebView2 on Windows, WKWebView on macOS, and WebKitGTK on Linux) with Rust handling the native side. The browser engine is normally a dependency outside the app package, which helps keep the download smaller. That changes the starting point.

With Electron, you distribute the browser runtime yourself. With Tauri, you generally rely on the platform’s WebView. The rendering engine still exists and still consumes resources; it just doesn’t usually arrive inside your application’s package.

Benchmarks can show Tauri doing well on bundle size, startup time, and idle memory. The smaller download makes sense because you’re leaving Chromium out. Startup time and memory usage are trickier because they depend on the platform, the workload, and how you measure them. For small desktop tools, I care about keeping the application’s footprint proportional to what it actually does.

Memory comparisons need more care, though. Both frameworks can involve several processes, and shared libraries complicate the accounting. Looking at one process in Task Manager won’t necessarily show everything your app uses.

But Tauri still runs a web frontend. Expensive JavaScript, memory leaks, and unnecessary layout work can still make it slow. Rust isn’t going to climb through the IPC boundary and tidy up your event listeners. Tauri can reduce the overhead you start with, but not your messy JS.

## Electron Is Heavy for a Reason
After spending some time with Tauri, I started appreciating the Chromium suitcase a little more. Electron lets you choose the browser version you ship. You test against that version, and your users get it too.

With Tauri, the WebView depends on the platform, and its version can vary between machines. The UI that works perfectly on your laptop might have other plans on someone else’s Linux desktop. Now part of your desktop development time goes into debugging browser differences. How nostalgic.

For the kind of small tool I was building, I was ok with the tradeoff. But if the app relied on heavy components like animations, graphics, or particular browser APIs, I’d want to test those features across platforms early. Shipping Chromium starts looking more reasonable when it saves you from maintaining workarounds for several rendering engines.

## Performance Is More Complicated
Tauri can look pretty convincing in a benchmark. But before getting excited about the shorter bars, I want to know what the test app was actually doing.

Startup time matters more for some apps than others. If I open an app once and leave it running for eight hours, saving a few hundred milliseconds won’t do much for me. If I’m constantly opening a little utility to do one quick thing, waiting for it gets old.

I’d also want to measure memory while the app is doing real work. An empty window is a useful starting point, but mine will eventually have responsibilities.

For my own project, I’d use those benchmarks to get a rough idea of the overhead, then test the actual application. How quickly does it open? Does the interface stay responsive? What happens to memory after I’ve used it for a while? Those results would tell me more than another framework comparison chart.

## What I’d Pick Again
For the small tool I was building, I’d use Tauri again. It gave me a familiar way to build the interface, a smaller package, and a comfortable excuse to try Rust. I was willing to deal with the platform differences.

With a team already invested in Node.js, or an application that depended heavily on particular browser features, I’d give Electron a much more serious look. I still dislike its weight, but I understand better what I’d be getting in return.

And if I only needed one platform, I’d still start by looking at its native stack. Apparently, that part of me is stubborn. I came into this wanting an alternative to Electron. Tauri worked well for my little project, and I left wanting to write more Rust. The compiler and I still have disagreements, but we’re seeing each other again.
