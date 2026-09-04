# Fitness App Architecture Adaptive Workout Generation

- Fuentes (videos) incluidas: 33
- Motor de síntesis: concatenación simple (Ollama no disponible)
- Este documento tiene dos partes: una síntesis organizada por tema (deduplicada, más fácil de leer) y un apéndice con el contenido COMPLETO de cada video sin resumir más -- para no perder nada, revisá el apéndice si buscás un detalle específico.

---

## Instrucciones para la IA que use este documento como fuente

Este documento es una compilación de investigación cruda sobre **fitness_app_architecture_adaptive_workout_generation**: Aprender (ultimos 90 dias) como se construyen del lado de PRODUCTO las apps de fitness que generan rutinas automaticamente y las adaptan segun el progreso real del usuario, para disenar la arquitectura de una app propia. Cubrir: como apps tipo Fitbod generan una rutina segun el equipamiento disponible (motor de seleccion de ejercicios por maquina/musculo), logica de progresion adaptativa/autoregulada (subir peso o reps segun lo que el usuario marco en la sesion anterior, deload automatico si hay senales de fatiga o ausencias), y UX de registro diario de entrenamiento (como Strong o Hevy dejan marcar series, peso, reps y RPE de forma rapida sesion a sesion). Tambien cubrir perfil de usuario (objetivo, nivel, preferencias) como input del generador de rutinas. EXCLUIR reviews superficiales de apps sin detalle de como funciona el algoritmo o el modelo de datos, y contenido de marketing sin sustancia tecnica. Tiene dos partes: la Parte 1 es una síntesis ya organizada por tema; la Parte 2 es la transcripción completa de cada video fuente, sin filtrar.

Si tu tarea es generar documentación técnica accionable a partir de esto, basate ÚNICAMENTE en experiencias reales y prácticas concretas mencionadas en el documento.

**Ignorá explícitamente:**
- Contenido promocional (suscribite, patreon, códigos de descuento, sponsors, "like and subscribe").
- Noticias o tangentes ajenas al objetivo del research (política, mercado de acciones, bans de modelos por motivos legales/geopolíticos, chismes de la industria) aunque aparezcan clasificadas dentro de una categoría técnica -- el clasificador automático no es perfecto.
- Comparaciones de precios/planes sin contenido técnico de fondo.
- Opiniones sin sustento práctico ("esto es lo mejor" sin mostrar cómo o por qué).

**Priorizá:**
- Comandos, configuraciones y pasos concretos que alguien ya probó.
- Errores reales que la gente encontró y cómo los resolvió.
- Nombres exactos de herramientas, plugins, versiones, parámetros.
- Si un dato aparece repetido en varias fuentes, es señal de consenso -- vale la pena destacarlo.

Si un dato de la Parte 1 te resulta dudoso, incompleto o fuera de contexto, buscalo en la Parte 2 (apéndice, con el crudo completo de esa fuente) antes de descartarlo, inventar un matiz, o asumir que es relevante solo porque está ahí.

---

# Parte 1: Síntesis organizada por tema

## AI personal trainer app architecture

### Auto-Regulation: How to Train Power Without Digging a Recovery Hole
https://www.youtube.com/watch?v=716nCgYxYUc
## Puntos densos

- It's a term some of you may or may not have heard before.
- And you're going to learn all of this by understanding the principle of A Reg, auto regulation.
- If we're working hard in a poor direction or with poor structure, a lot of times it can do us more harm than good.
- I'm sure there's kids in your team that you work harder than that are just better than you or they're ahead of you for a variety of different reasons.
- This all goes back to the '60s and '70s when there was a Soviet Olympic lifting coach.
- If you do too little, you're not getting the most out of what you could have done that day, and in turn you're leaving adaptation on the table as well.
- And this is all relating to power, right?
- Hypertrophy, strength, it's a little bit different.
- All of those would be examples of power.
- And it's no coincidence that those are kind of what is required in elite athletics.
- Do too little, it's not enough stimulus for your power to adapt.
- Do too much, your power falls off a cliff, and you potentially maybe opening yourself up to getting injured.
- I know if you've watched my videos before, just know that we always I want to lay out all the context I can first, and then bridge it all together so it can apply to you as a baseball player.
- We're going to develop ways to allow the athlete to tell us what their best output is that day, and then follow that.
- And we see that happening a little bit more often now, but it goes deeper than what you may conventionally see.
- Some people might just be like, "Oh, VBT, that that's that's all this is." It's it's much deeper than that.
- So, the ability to have auto regulation and to be able to have flexibility within what our our reps are for a certain throw is extremely valuable.
- It's not like a back squat or something else.
- It's so much more like CNS demanding that it can vary wildly.
- So, when we have this framework in place, we can really avoid senseless injuries, and we can stack the best reps possible each day, taking into account all of these other factors.
- We're never going to actually know what all those are each day and be able to be like, "Okay, this is what the number we should do today is." Because of our Whoop says this, and I feel like this and all that, that's not going to work.
- What we can do though is we can have a set percent fatigue cut off and go off of that based off of our best bullet that day.
- One group performed it to 40% of a drop off from their best bar speed of the day.
- It's very prevalent in baseball.
- So they stopped 50% earlier than the other group, right?
- That's it's kind of a big difference.
- The group that did more grindy reps and kept going, they gained more muscle mass than the other group.
- You look at their power testing compared to the group that cut it off early, significantly less power displayed.
- I'm not going to sit here and say doing these extra reps is going to make you weaker.
- Obviously there's times when we're going to be grinding out reps to get more lean tissue, but the majority of y'all like, bro, it's the power.
- They're not necessarily the ones grinding out the extra back squat rep all the time.
- Grindy reps are not necessarily better for throwing, and in fact, they may hurt your power.
- So, when we apply that to throwing, which we will do later on, you can see where this is going here, right?
- What we're actually going to put something in place, we're going to put a formula in place, so we don't accumulate a bunch of mid reps, which is what a lot of you guys do in terms of pitchers for throwing on high intent bullpen days.
- It's no coincidence that the Soviets have their fingerprints all over this idea, considering they're the pioneers of athletic performance through the 50s all the way to the 90s essentially, with a lot of innovation and a ton of world champions in a variety of different athletic events, especially power-based ones.
- So, we'll talk about applying this to throwing in in more detail here.
- And if we have a 1% cutoff, the way that would look is you are warming up for, let's just say, shuffle throws.
- You warm up and you throw a couple times, and say the first throw is 88.
- You put 88, and now if there's anything below that 88, you are done for the day.
- So, one, you have that monkey over your back of you got to keep climbing or at least stabilize, or else you're done for the day.
- And as you climb, your cutoff will climb with it.
- Then you can look right here, put on the screen, you can see the cutoff.
- You can see the new cutoff when we put 90, and we'll do another rep.
- You can see the cutoff rise again there.
- You can see the cutoff rise again.
- Okay, let's say now we're going to do a 92, and it's going to tell us to stop.
- If you don't have it that day, you're probably going to end up below your cutoff earlier.
- And then And then you're going to get stopped and we're going to live to fight another day instead of just digging mindless reps way below what you're capable of because you're frustrated and you're banging your head against the wall.
- You can see here I'm doing a physio ball lat med ball throw.
- You can see what I'm doing here.
- Once I hit a cutoff, I'm done, but I can accumulate all of my quality reps for that day.
- It's It's all in there.
- Okay, you your your arm isn't feeling great that day.
- Let's say your first throw is 87.
- Okay, your first throw is 87.
- Now you're 88.
- If you're running A-Reg, you are now done for the day.
- You're no longer digging yourself a recovery hole cuz your ego's pissed off about your number.
- What you're doing is you are going to assess why you felt like that, make necessarily make necessary changes, and move on.
- I'm going to throw another one." And he maybe climbs back up, and then he just keeps grinding.
- And then that's where that's where you're exposed to injuries, right?
- And you can see the contrast between those two athletes, one that is running A reg with us, or one that is just going in there and going, "I'm just going to keep throwing cuz I'm pissed about my number that day." I'm sure you guys have been through that.
- At best, that's just hurting our power and we're not getting At worst, we're getting hurt from it.
- Other days, we might accumulate way more than what we had scheduled cuz our body was ready for it that day.
- And we used it We used math essentially, and equations, you know, that have been formulated through brilliant Soviet minds over the last 40 years to help us and help facilitate our training instead of just doing it all on your own.
- We used auto regulation throwing with Nick.
- So, I'm glad that that Nick was able to hop on board with us about about 7 months ago and the results have been great for him and he put together a really solid year in terms of health and in terms of performance, which is just the best of both worlds.
- When he first hopped in with us, he was he was dealing with shoulder pain and he was coming off a really tough year and we use some auto regulation within his program to really set him up to accumulate a good amount of innings and put himself in a better spot where he had scholarships from a handful of Division 1 schools and he ultimately got to commit to go play in the American conference.
- Um so I couldn't be more happy for Nick and if you want to if you want to alter your career like Nick, then just book a discovery call.
- So the thing is you can have VBT without auto regulation because it's a fixed velocity zone.
- All good VBT is a form of auto regulation but not all auto regulation needs VBT.
- So we stop when we lose a certain threshold of velocity, percentage off of it.
- You find today's peak and base off of the velocity drop off from that, that lets you know when to stop or when to keep going.
- We're finding your best throw using A-Reg and then the percentage off of that.
- So some days that's going to be 94.
- Some days that's going to be 89.
- Like, I can't do a 1% cut off.
- In that case, we can expand the percentage cut off, right?
- And we're still training our best reps within that cut off, right?
- Because we're still we're not accumulating those shitty reps, which is the biggest part there.
- So, what a 5% cut off would look like, I'll show you another example here.
- We can see we now have more leeway here, but we still have a cut off.
- That's the biggest thing is we need that cut off to be able to adapt to us daily.
- And that cut off is based off of our best bullet for that day, which adapts to us every day, which is why it's so beautiful.
- One of the simplest ways without training with us, without doing anything to try this out, would be to like find a piece of tape and tape it on a wall as high as you can jump and see if you can just keep hitting that piece of tape.
- That's like bare bones, one of the simplest ways to apply A reg.
- That's just one of the simplest ways to apply A reg.
- So, maybe you go try that on your next power day and see how that feels because you're actually getting the most out of what you have each day, which is again, the most beautiful part of this.


### Claude Code Built My AI Fitness Trainer (Kettlebell Coach, Full Cost Breakdown)
https://www.youtube.com/watch?v=MaHITJel8ew
## Puntos densos

- It's looping seamlessly and it's coaching me through a follow-along workout using an app that I built myself using code code within a couple of hours.
- I would log on to YouTube, try to find a workout and sometimes it's really hard to find workouts that suit my needs.
- Sometimes I might only have 20 or 25 minutes for a workout and some of them go for 45 and maybe it's not the type of training style that I'm looking for.
- Set duration, set exercises, set rep scheme.
- If I want a shorter workout or a different exercise mix, then I need to go searching for a new video and to be honest, sometimes that video doesn't even exist yet.
- So I built a version where the trainer footage and workout schedule are completely [music] separate.
- The workout is a config, format, duration, exercises, reps.
- There are three things that make it different from just another fitness app.
- There's the same trainer, the same clip library, any workout format, EMOM, ladder, intervals, [music] AMRAP.
- It's all completely AI generated, [music] seamlessly looping and synced to the timer.
- I do plan to upgrade this app later so I wanted to make sure that the history of the app development is all kept within that cloud MD file.
- Just so that when I do make these updates, the new session will have all of the context of what I've done so far.
- I just wanted to make sure that the workout engine was working correctly first.
- So I wanted to give as much flexibility as possible to be able to set the duration, to set the exercise goals, whether it's fat loss, strength, cardio.
- And phase two is where I used the Hicksfield MCP to build out all of the images that would eventually become videos.
- And then phase three was wiring up the video player just so that all of the images [music] could become videos and then be played according to the workout timer.
- It takes the config and then figures out the workout from there.
- I also added a line of code to make sure that the browser doesn't freeze when it's advancing to the next workout.
- The actual application build was pretty straightforward, but when it came to refining the clips for the trainer and getting those clips right, that's where things required a bit more work and exploration with Hicksfield.
- I had to go through various different iterations to make sure that the the clips were right and that they were that that were framed correctly.
- The one trick that I did learn is you have to make sure that the start and end clips are exactly the same >> [music] >> just to make sure that there is an invisible gap.
- Phase three was when I wired up the video player.
- Whilst one clip is playing, the next clip is actually preloading in the background so that it's ready for when that exercise ends >> [music] >> and the new clip is seamlessly loaded up without any delay.
- It took two sessions, so I used Fable up front just to lay out the plan and to get all the all of the foundation set, and then I was able to move to a cheaper model to do the actual build. >> [music] >> And as I went through and continued to iterate on this, I added some more game-like features just to give it that premium feel.
- So, you'll be able to see exactly what it takes to build out an application like this.
- And at Higgsfield's top-up pricing, it works out to roughly be about $25.
- Like I said, it's not finished, but I think I have more than enough room in my Higgsfield budget to bring the app more to life, to fix up the trainer, to create more looping videos, and to also generally uplift the app to make it more premium.
- I have more than enough usage before it before it resets.
- So, I wanted to use this as an experiment to see how far I can push it.
- I've had this idea for a while, so I wanted to finally bite the bullet to see how I could bring it to life and I was so surprised with how quickly I was able to do it.
- It's something that I'm going to be using every week to help monitor my fitness and to help streamline my workouts and to make it more calculated.
- And also making sure that I'm working out with enough intensity.
- If you want to know more detail about this project or if you want to or if you have any questions about how I was able to create the videos, please leave a comment in the description below and like and subscribe if you have if you want to see more of this content.
- I'm going to host it on my website so you'll be able to see how it works and see some of the quality of it.


### Finally a Gym App That Doesn't Suck | WorkoutBuddy
https://www.youtube.com/watch?v=9YqkzTY_Zhk
## Puntos densos

- Workout Buddy is built for real training.
- Use the workout log and progress tracking to stay organized.
- Workout Buddy helps you train with structure and measure real progress.


### FIT8: entrenamiento, nutrición y acompañamiento en una sola app
https://www.youtube.com/watch?v=labH03l2p64
## Puntos densos

- Con FitAid, avanzar deja de sentirse confuso.
- En FitAid tienes todo en un solo lugar, tu nutrición, tu entrenamiento, tu seguimiento y las herramientas que necesitas para avanzar cada día.
- Y para dar continuidad a tu proceso, puedes tener citas de seguimiento por chat o llamada con tus profesionales.
- También puedes agendar citas con tus profesionales y elegir horarios que se adapten a tu rutina.
- Todo eso y más es FitAid, nutrición, entrenamiento y acompañamiento en una sola app.


### The Outsiders: Apple-Level UI Designed For Building Trust  | App Breakdown #81
https://www.youtube.com/watch?v=l1j7jGHQJaM
## Puntos densos

- I'm a professional app designer and in this channel I review apps from all sorts of categories and give you the design insights.
- So if you're an app nerd or design nerd, make sure to subscribe.
- Let's go into Outsiders.
- Opening up the Outsiders app for the first time here.
- I'm expecting this app to be very beautifully designed, not only because of what I saw on the App Store itself, but because we have already reviewed an app from the same team called Gentle Streak and it was a very good one.
- I will say I'm not sure if it's because the foot is very colorful and occupying a lot of space on the screen, but it's distracting me a lot from the text.
- Like the bottom of this screen feels very very heavy compared to where the actual information is up top.
- So let's just continue.
- Let's go with Jose.
- I'm not sure if you noticed that, but I input in my name and then it went to the next screen and now it plays a beautiful animation asking me for permissions.
- Very cool.
- Like I trust this app already and because I trust it, I'm more likely to connect it to my health, which is what I'm going to do now.
- So, I'm just going to do turn on all, which is not something I recommend you do for apps in general, but I do trust this team.
- Let's just go for it.
- Very very clever way to ask for notifications.
- It's like, here's the value, here's the value, here's the value.
- So, let's click allow here.
- Let's hit let's go.
- So, it seems like we are at a paywall on top of the home screen.
- It feels very much just like a standard paywall, whereas everything else before it was like custom-made with care.
- So, I'm not sure what's going on here.
- Let's close the paywall for now.
- So, you can see that it's very Apple style in its nature.
- Then we're going to look at the main screen later, and at the bottom we have a standard navigation style with today, progress, workouts, and a star that I'm assuming just leads you to the paywall, but I'm not sure.
- But, let's actually look at some of the information that they're displaying us on top of this beautiful illustration here on top.
- Okay, so it's just telling me that I'm ready for the day.
- I've been a user of Whoop in the past, so I'm used to some of these metrics.
- Let's see, I have my training balance here, then I have my body metrics, and that's pretty much everything that's on the home page.
- It's a very, very simple home page.
- Usually these types of apps what they do is they give you the main information up top, then some secondary metrics, and then try to like upsell you into different things.
- You either already have very good product market fit, and so this does not hurt metrics and actually makes people trust your product more, cuz it never seems like you're trying to upsell things.
- Or not upselling if you don't have very, very clear product market fit and good growth metrics can hinder your growth.
- So, this would be a good place for them to show me what I can do more with the app and to upsell me into going for the premium.
- Let's try tapping on the main graphic on top where it says 99%.
- Let's hit that.
- There's a chevron, so it's going to open a page.
- Very beautiful gradient on the background.
- I haven't read anything, but just like if I squint my eyes, there's a very clear hierarchy on all of the text, all of the colors, and it just seems very, very balanced.
- So, what we're seeing here is my training load.
- I'm not sure how it is being calculated cuz it's very rare for me to actually use my Apple Watch or take my phone when I do sports.
- So, it's just showing me like different data visualizations.
- And we have here a way to display information just in rows.
- It's just like information, beautifully displayed information, etc.
- But so far, the app seems very passive, almost.
- Let's go back into the home, try to tap into some of the body metrics.
- So, if I open it, it's like a page, but almost constructed as a sheet.
- So, if I paid and I swipe left and right, I'll be able to go between metrics just like on Apple Books, you're you're able to go between books.
- And in this page, it seems like we have very much the same type of content organization that we had on the training load page, which is a good thing.
- It teaches me to read the information throughout the app, and it's just a good way to reuse UI.
- Let's try hitting a different time frame here.
- So, this app is very, very much for the paid user and not for the free user, which is completely fine.
- Let's try hitting the customize at the bottom.
- So, let's turn on training form here and turn off heart rate just to see the differences.
- Let's see what it looks like inside.
- It seems like it's very much the same type of information architecture, which again is just good usability of content, and they changed the gradient on top.
- Actually, very, very recently I've designed something with this type of gradient on top.
- So, let's go back and go into the second tab, progress.
- So, in progress oh, now we have a lot more data here.
- Very cool.
- Let's try hitting that.
- Okay, this sheet is very slow.
- So, let's go workout type.
- Once again, very slow.
- Let's click add.
- Now we have my training goals here on top with the dancing man in the middle.
- These types of rings and colors very much remind me of Apple Fitness and Apple Watch.
- I'm sure that's where they got the inspiration from and rightfully so cuz it's an awesome design.
- And below we have some more data and different types of data visualizations this time.
- Okay, I have no idea how to read this chart actually. >> [laughter] >> So, I'm guessing that's not the best way to display it or maybe I'm just stupid, one of the two.
- And then we have more ways here, pretty cool and then always the learn more at the bottom with different backgrounds to separate information from upselling.
- So, let's go back.
- Then we have my fitness that has the same data as before and my cardio fitness.
- Let's go back.
- So, once again, we have information visualization up top, so it's consistent across the three tabs with the gradient there.
- Okay, let's tap on the plus, try to add a workout.
- It's changing the color.
- I'm not sure about the use of color, cuz to me purple doesn't mean extremely hard, and cyan doesn't mean extremely easy.
- So, the use of color here could be much better.
- So, let's just do hard here and add.
- Here, we can see that it was somewhat hard.
- I love screens like this one, especially when the CTA also changes color.
- And let's go back and close out with just a reflection on the overall design.
- So, one thing you've probably noticed while going through the app is that the design feels extremely clean and familiar at the same time.
- This is because they mostly use components from Apple or that mimic Apple very closely, which is a great technique if you want people to trust your app by default.
- Just give them what they already trust and what they already have in their minds as good design and good apps.
- Of course, on top of that, the team here has added a lot of things that actually make this stand out.
- It's not just copying Apple, far from it, but it's picking up the tools that Apple gives developers and designers and just really, really making them shine and just using them everywhere and then giving them your touch.
- I've talked about this in a lot of episodes like, don't reinvent the wheel when it comes to designs, use the standards and give them your own little taste, and I feel like that's exactly what the Outsiders team has done here.
- In terms of design, I really love this app, especially for UI and for information organization.


### This AI Knows Exactly What You Need to Train
https://www.youtube.com/watch?v=EC25d2kpSAQ
## Puntos densos

- And this is basically an interactive um AI tool that is going to help you build your workouts.
- So, by the end of it, you end up getting an 8 to 12-week training program based on everything that you want.
- So, you're basically going to talk to it like you were talking to your coach, your trainer, anybody who would be building workouts for you.
- So, kind of think of it like you first turn you first signed up to a personal training um session, and you're doing like your intake session.
- They are asking you questions on what your goals are, what you're looking to get out of the experience, things like that.
- And then by the end, they build your program.
- We're going to build a workout.
- And if you hop on this and you want to build one based on your information, drop it in the comments, and we can go through it a couple times with different examples.
- So, build a workout that fits my schedule or build my personalized workout program.
- Let's build a workout that fits your real schedule, not your ideal one.
- And it asks you, "What's your goal?" I'm going to say recomp.
- It says, "When you say body recomposition, I'm assuming you want to build muscle while reducing fat.
- So, then it asks you, "Where will you primarily be training?" I made sure this question is in here because a lot of times nowadays people are doing more hybrid style training.
- They're doing some days at home where they only have certain types of equipment and they're also doing training at the gym.
- So, um I made sure to have both in there because it's going to then ask you for the type of equipment you have in each setting so that it knows what exercises you have access to for uh each day.
- And if you're somebody who works works out only at the gym, this works as well.
- I'm going to say that I work out at the gym and at home.
- Be as specific as you can." Here, you want to make sure that if you are listing equipment, make sure you're you're being specific in terms of how much weight you have access to, especially for home stuff.
- So, I'm going to say I have dumbbells up to 50 lb.
- If you know you can only go to the gym 2 days a week, then put 2 days a week.
- I'm going to say I'm going to say three.
- Actually, I'm going to say two because people think you can get results on a two-day plan.
- I always say 2 days a week is more than enough to make progress, especially with workout I mean recomposition, especially if your workouts are structured well.
- So, the best way to do working out 2 days a week is to do two full body workouts, because if you're only going 2 days a week, there's no sense in doing upper body one day and lower body one day, because you're not hitting your muscles frequently, only doing them one time a week.
- You need more volume, and it's it's going to suck to try to squeeze all of your volume into one day.
- So, spreading it across 2 days and hitting all your muscle groups two times a week is going to be a lot more sustainable and a lot more effective.
- So, then it gives you the sets you're going to do, and then you're going to choose the exercises.
- So, it's going to go through picking your squat, your hinge, your push, your pull.
- But, let's just go through a couple, and then we'll go through this first one, and then we'll have it build the second.
- So, I'm I'm say I'm going to do a goblet squat.
- Arnold press is a different variation of shoulder press where you start with your palms forward and you rotate and press up.
- That's the push variation that I want to do.
- So, I'm going to put Arnold press even though it's not on the list.
- So, that's workout A.
- Your first workout is completed.
- Now, it's going to tell you to build workout B.
- I don't want to go through that entire process of picking each exercise, so I'm going to have it build build it for me.
- We do want um variety across each workout and you want to keep those workouts the same for multiple weeks.
- So, workout A should have different patterns than workout B.
- All right, so these are your two workout programs, I mean, two workout days, workout A and workout B, and then it cues you to stay consistent with this for 8 weeks.
- If you have been following me for a long time, you know that 8 weeks is still probably a short period of time to follow a workout program, but that's the shortest amount of time that I would recommend.
- So, do it for 8 weeks and then, if you have specific questions on like progressive overload, how to set up your calories, when it's time to change exercises, what you should change it to, how you should progress, how to progress beyond just adding weight, then you are going to grab the Lifter's Blueprint, but this workout builder gets you like 90% there.
- So, if you want the builder, just comment builder and I will send it to you so you can start using it today and you can pretty much always access the same um template and ask it to make edits.
- However, you would talk to me in the DMs is how you should talk to this workout builder when you're using it.
- So, if you want the workout builder, you want to put in your own information and have it build a program for you, comment builder and I will share it with you.


### ¿Cómo Construí una App de Entrenador Personal con AI Studio en Gohighlevel?
https://www.youtube.com/watch?v=P0UP3L_Sf0c
## Puntos densos

- Es un entrenador personal impulsado con inteligencia artificial y creado dentro de AI estudio de Go High Level, que crea rutinas adaptadas al usuario y dietas personalizadas e inteligente con la información que ese usuario ha introducido a la hora de registrarse dentro de la aplicación. tiene rutinas, dietas, lista de la compra para esa dieta, progresos, logros, medidas corporales, ranking, muchísima información y todo totalmente personalizado a cada usuario.
- También tienes un asistente que responde las 24 horas del día, los 7 días de la semana sobre te responde cualquier tipo de pregunta de duda que tengas sobre cómo realizar este ejercicio, cualquier duda que tú puedas llegar a tener.
- Vamos bajando por aquí y aquí tenemos planes y precios que ahora mismo no están activados, así que podremos elegir cualquier nombre, cualquier plan que tengamos.
- Vamos a poner Juan Antonio, no tenemos, vamos a ponerlo con datos ficticios porque ahora mismo no está activado.
- Bueno, aquí eh cuando os metáis eh os va a saltar nada más meteros, os va a saltar esto para rellenar los datos y que esté totalmente personalizado, pero a mí no me salta porque ya tengo una cuenta registrada.
- Vamos a rellenar aquí con datos totalmente ficticios aquí simplemente para que veáis cómo funciona la aplicación por dentro.
- Si tienes algún dolor, merita física, tu objetivo principal, nivel de experiencia en el gimnasio, en lugar de entrenamiento, si es en el gimnasio, en casa, en casa aquí te salca un desplegable en el que tú puedes elegir si tienes más materiales que puedas utilizar en casa, si quieres añadir más. ¿Cuántos días puedes entrenar?
- Si tienes alguna restricción alimentaria o alimentos que puedas llegar a evitar porque tienes alergia o porque no los puedes llegar a tomar.
- Bueno, aquí ya te tira todo totalmente personalizado.
- Aquí te tienes un desplegable que pone mi equipamiento que puedes agregar más cosas por si te compras cualquier cosa poder agregarlo.
- Bueno, aquí tenemos los martes la rutina.
- Tenemos un vídeo explicativo aquí para que puedas ir viendo cómo se realiza el ejercicio.
- Luego, si tú, por ejemplo, vas marcando porque ya vas terminando los ejercicios y los marcas todos, rutina completada, has terminado todos los ejercicios de hoy.
- Aquí tienes una guía de de estiramientos después de entrenar, según lo que hayas hecho ese día.
- Aquí tenemos, podemos ir marcando, tenemos una pequeña gráfica en la que nos saldrá las proteínas que hemos consumido, los carbohidratos, las grasas.
- Aquí si damos receta completa podemos ver los ingredientes que podemos que tenemos que utilizar y los pasos para prepararlos. me da cada día me da una distinta porque no vamos a comer todos los días lo mismo.
- Aquí vemos que ya vamos sumando puntos dependiendo dice si vamos eh completando más cosas. progreso.
- Entonces tú según vas, por ejemplo, vas progresando los días de la semana, por ejemplo, una semana entera ya completa un día de pierna, pues se te va marcando la pierna con un uno de estos colores hasta llegar al final, que es Dios del Hierro, que es el máximo rango que hay, por así decirlo.
- Aquí tiene la lista de la compra semanal para que puedas ir hacer la compra de para poder completar toda la dieta.
- Puedes ir rellenando aquí con el peso que vas teniendo, lo vas guardando, lo que te va midiendo el brazo.
- Luego tenemos un apartado de galería de fotos de progreso que es es tú pones una subes y la puedes comparar con una foto, por ejemplo, del día anterior, una [carraspeo] foto de la semana anterior para que vayas viendo la evolución que vas teniendo con respecto a otros días. tenemos un historial que es, por ejemplo, yo, imagínate que estamos ya el lunes y quiero ver qué hice, que llegué a completar el sábado, pues me meto en el 22, que estaría aquí en verde, y veo la actividad que he tenido el el día 22, las comidas que he completado y los ejercicios que he realizado.
- Eh, luego tenemos el ranking, que es el ranking es que tú puedes agregar amigos para tener, mira, aquí tenemos racha, que es los días que lleváis siendo amigos, que lleváis conectados, los puntos que lleva la gente.
- Bueno, y aquí para agregar amigos, simplemente tienes un código que lo copias y lo pegas aquí y así añade a más gente, ¿ves?
- Puedes agregar notificaciones dentro de la propia aplicación o puedes agregar notificaciones en tu propio buscador para que te salte las notificaciones de qué rutina tienes que hacer hoy.
- Y bien, como vemos, la aplicación es fantástica, no le falta ningún tipo de detalle ni de funcionalidad, con lo cual os animo a utilizar el AI Studio de Go High Level, puesto que mediante el PR y iterando con la IA podemos ir creando ya no solo una simple landing o una página web con un calendario, un formulario, etcétera, sino que ya podemos crear también ciertas aplicaciones con ciertas funcionalidades más específicas adaptadas a cada nicho y de esa manera podemos aportar mayor valor dentro de ese proyecto para el nicho o el profesional correspondiente.
- Así que hasta aquí este vídeo, espero que haya sido de utilidad y que sobre todo os haya gustado, ¿vale?
- Entra en metodológico Free, ahí te explico qué es Go High Level, para quién es y resuelvo todas tus dudas antes de dar el siguiente paso.
- Nos vemos dentro y si este vídeo te ha servido, suscríbete para no perderte ninguna de las próximas novedades de Go High Level.


## General

### Anthropic Just Dropped the Biggest Claude Code Update Yet
https://www.youtube.com/watch?v=B-YQANvDOq0
## Puntos densos

- Okay, so earlier today Anthropic released what I consider to be the best feature in Claude Code yet, function hooks.
- But first of all, if you don't know what normal hooks in Claude Code already are, then I do have a free video about this on my blog linked down below.
- Where I basically give some motivation for why hooks in Claude Code are handy and why you may want to use them.
- Now function hooks basically take hooks to the next level and make Claude Code even more hackable and customizable.
- And they solve some of the existing issues with hooks in Claude Code.
- The reason why we use hooks is to basically add deterministic control to Claude Code.
- And then as your context store is filling up, the rules at the beginning in your Claude MD file and your system prompt can fade over time and Claude may forget to apply those rules.
- Or you may get a bit sloppy in your prompting and you may give a lazy prompt, Claude misinterprets it and then runs a dangerous action.
- So for example, in this case, before it runs a Bash tool, then it will run this script over here, which refers to this Bash script called supabase-guard, which will basically block any commands such as deleting a Supabase project.
- They can't draw buttons or a status line and rows and stuff on Claude Code.
- So on any tool call inside of Claude Code, we can match it to a certain tool, such as the Bash command.
- And this means that we can do pretty interesting stuff inside of Claude Code, kind of like this.
- So you can see in this case, on any tool call that Claude Code does with the Bash tool, we basically replace npm in the command with pnpm install instead to prevent it from doing something such as accidentally using npm on our codebases.
- With Claude Code function hooks now come with a store.
- So for example, over here, if Claude Code were to do a web fetch, then it would first look in the store inside of Claude Code to see if that URL has already been fetched before.
- Now another pretty neat example is I can override any default tools inside of Claude Code.
- So for example, Claude Code has a web search tool, and I don't think it's very good because I use Brave Search behind the scenes.
- One of the problems can be that Claude Code will still end up using the web search tool, even though I told it to use an Exa MCP.
- If it failed for whatever reason, then it will default to web search tool.
- Claude Code also has a web fetch tool, which sometimes ends up getting blocked.
- Now we have a whole bunch of building blocks when it comes to function hooks in Claude Code, as well as my favorite, which is making changes to UI to make it more customizable for your workflows.
- Now you may be in a situation where Claude Code accidentally loaded in a secret into your session transcript by running some kind of Bash command, and it's now like, oh no, the secrets are now in the session transcript.
- And the way we can do this is by first enabling function hooks by running this command, CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude, press enter.
- So it says over here, Write or debug a Claude Code plugin made of function hooks.
- So pressing enter, I can basically say something like, hey, can you make me a function hook that will basically block any secrets from entering the session transcript by measuring the entropy and also make another one to block emails and anything that looks like an IP address.
- Pressing enter, it will basically go ahead and make that function hook for us.
- Okay, so now it's built out the functional hook and I'm really surprised because it went the extra mile and did something really clever.
- But if I go over to the project now, I can see in the .claude folder, I have plugins.json, transcript_redactor.json, hooks.json, and then redact.ts.
- So this is the hook that it designed over here, about 300 lines.
- So pasting that in over here.
- Pressing enter over here, you will see it was automatically redacted, the secret, as soon as I pressed enter, and it got replaced with an ID.
- Now this secret is now stored in memory in the line that I just showed before.
- And now when Claude makes a request, a Claude request, then it actually uses a secret right over here, the ID of the secret, not the secret itself.
- And when this request is made, then the hook automatically rewrites it to the correct secret.
- And the store that I used over here was essentially the variable store where the next hook and the next turn can see the variable that was defined.
- Okay, so one of my favorite parts is this new UI thing where we can get a function hook to customize a UI of Claude Code.
- So let's actually design that over here.
- So I'm going to do /plugin-authoring again and say, can you make me a hook that will basically show me next to the prompt status bar, the current Vercel deploy and the stage that it's on and how long it's been building for.
- So it's now asking me a few questions of how it should look like over here.
- So now it's built it out over here and called it Vercel deploy status.
- So now I can see something really cool here.
- And I can also press this button over here that will basically allow me to hide this and then also reshow it.
- So each function hook, which we define inside of a plugin, we now have a panel where we can view data live.
- But also, if you do want early access as well, then you can go on the website and fill out the form down below.
- Now, some more function hooks that you may want to make is you may want to make one that is for dry runs.
- So if you do any kind of data analysis, you may first want to go for a dry run before the real analysis actually happens.
- We may also want to combine this with the previous UI thing, So in big red characters, it would say something like, hey, you're running in production, or hey, you're running in dry mode.
- And this works really well with the ask function as well.
- Another way of using the ask function is basically I can tell Claude Code every time it comes across and edits a file that goes beyond 1,000 lines, then it automatically asks me, hey, do you want to refactor this file to basically split it up into smaller files instead?
- And this can be really effective for making sure Claude Code doesn't add really massive long files like 2,000, 3,000 line long files because for some reason models still like doing that.
- And to basically do that, I can run Claude Code with enable function hook, do /plugin-authoring, and then say, can you make me a function hook that will basically ask me every time a file that you're editing whether the file should be refactored to make it smaller into many smaller files instead.
- So if I give a prompt kind of like this, then it will make that function hook for us as well.
- If you're working in an industry with a lot of compliance like healthcare or payments, then you may want to set up a hook very similar to this, whereby on every single event that Claude Code runs, it automatically sends all the results over to your own log store that you may have for your organization.
- You may want to prevent it from automatically sending the email newsletter until it has used the ask user question tool to verify that you actually want it sent, and until it made sure that you spent enough time actually reading through the newsletter as well.
- Essentially, function hooks are now a really powerful primitive inside of Claude Code, which is why it's now my favorite feature, because now we can customize and hack Claude Code in all sorts of different ways.
- And you can also just tell like /plugin-authoring, point out your Claude.md files and be like, okay, which hooks can we make here to ensure we have more reliable deterministic behavior going forwards?
- So all the things that you may have been putting in your Claude.md files, you can start removing and putting into really well-defined hooks.json instead.
- And speaking of teams, if you do want training for your entire team or your organization personally from me, then there is a form down below that you can fill in.
- A lot of companies have been requesting this from me recently to basically bring all their engineers up to speed and to find Claude Code and Codex workflows that work really well for their organization.
- And now it seems Claude Code can now speak to us.
- And I can see that right over here inside of the UI.
- So if I look inside of this function hook over here, I can see that it made a small persistent prompt, which goes over to the Haiku model.
- For example, whatever the user prompt is, we can automatically generate a few keywords and then use like $http to query our company knowledge base in a secure way to automatically get any additional context from it to inject into a session.
- Or you can do something kind of like using this alongside the UI ask, whereby when it comes to opening up a brand new PR, Claude Code will generate a quiz for you to make sure that you correctly understand the changes that it made before it actually allows you to open up a PR.
- So if you do want to get in on the lifetime deal to get access to every future class and cohort for one price, then now is the time to do so.


### Garmin Cirqa Ultimate Accuracy Review (vs Whoop, Fitbit, Amazfit)
https://www.youtube.com/watch?v=2K4x0CnuQug
## Puntos densos

- So today I have a complete Garmin Circa deep dive, but more than just Garmin Circa.
- And more than just the Circa wristband, but also the Circa Bicep Band.
- And of course comparing this all to heart rate straps, as well as other data sources.
- In this video, I'm going to dive through a bunch of different categories, including the accuracy of heart rate data while working out, both for myself as well as my wife.
- There's more than just accuracy of heart rate data.
- I'm also going to dive into sleep data.
- I'm going to dive into step data.
- I'm dive into calorie data.
- I'm gonna dive into automatic exercise recognition and how accurate that is because at the end of the day, I'm gonna tell you a bit of a secret here.
- It is not about sport heart rate accuracy that's going to matter the most in most of these wearable devices.
- That is actually the most important thing and even far more important on Circa for reasons I'll get into in just a moment.
- Uh the first one is the Circa on the wristband right here.
- On the other side, I have two more devices here.
- That will trip up both heart rate as well as step data.
- Like, just factually speaking, if you're comparing a wearable up here to a wearable down here, this is going to do better every single time when it comes to workout data.
- Next, from a heart rate strap standpoint, I'm using both a Garmin HM600, their latest heart rate strap, as well as a Polar H9 heart rate strap.
- I've been using these straps for a year in the case of Garmin and many many years in the case of Polar and all of them are perfectly accurate for capturing heart rate data during workouts.
- And then finally, as you can see, my wife right here, she has Circa on one side and then a Garmin Fenix 8 43mm watch on the other side.
- That's notable because that has Garmin's Gen 5 optical heart rate sensor versus Circa has Garmin's Gen 4 optical heart rate sensor.
- She's also wearing a chest strap, sometimes Polar, sometimes Garmin, with each one of those data sets.
- Okay, so with all that basics out of the way, let's dive straight into the workout heart rate accuracy.
- So, for workout heart rate accuracy, we're going to start off with an indoor trainer ride.
- These are one of the easiest things for optical heart rate sensors or all heart rate sensors to get right.
- And as you can see here, it's spot-on.
- And actually, here is her data on this one.
- And what's fascinating about this is it's comparing the Fenix 8 43mm on one side to Circa on the other side and then a chest strap.
- Like super well done to this day. probably not having the additional rain and some of the additional wind probably helped a little bit and keep things a little bit warmer in the wrist there.
- If you look at this one section that I've highlighted, that section is like a really chunky gravel, basically a mountain bike section that we went on.
- A Fenix 8 is heavier and it's going to bounce around a little bit more on that bouncy terrain than Circa would because it's quite a bit lighter. the same truths and that's been the case for many many years on watches where heavier watches tend to do worse than lighter watches.
- And the reason it's so important to bring up temperatures is that I've seen some people compare accuracy charts where they take winter data, they take summer data, and they put it on one single chart like giving a score to every wearable.
- You should instead compare devices on the exact same day, the exact same time.
- Now, next up, we've got a run, relatively steady state run here.
- However, 2 days later, I went out again for an interval run here.
- You can see these basically 8x 400 meter rebeats and the circa wrist one completely fell apart.
- It is missing almost every interval. got like one interval correct.
- Nothing crazy about this crush gravel kind of a trail path just over and over and over again.
- Now wondering about this, I went out again the next day.
- This time a fine by repeat and it's exactly the same.
- I put the one I had my bicep down my wrist and vice versa.
- Went out again today for now the third time of 400s and again the wristbase one crapped itself.
- I'm going to call my friend and make him suffer, too." So, I called up Dez of Desfit, sent him out to run a bunch of intervals and suffer.
- And he went out and suffered, and his was perfectly fine, as you see right there.
- One slight bobble midway through on one of those, but no problems at all.
- Maybe if I had another month worth of running data, I'd be able to figure out, hey, it's these 400s that cause it but not the 800s, the 1200s, or maybe it's this temperature, or maybe this terrain.
- Now, one thing I do have though is position fuel and hydration products on all my runs and rides.
- As well as, of course, Precision Fuel and Hydration gels I've been using for many, many years.
- One of the things I love about Precision Fuel and Hydration, though, is more than just the products themselves, which are totally fine to consume, even when I'm like 14 to 17 hours into a hike or some sort of trail run for that particular day. but also the fact that they have sport scientists on staff that you can have a Zoom call for free to talk through your particular racing or training need.
- And again, it's totally free.
- Now, all their products are in form sport certified, all are vegan, all are 2 to1 glucose fructose and contain no artificial ingredients.
- Now, one more accuracy section I want to dive into from a heart rate workout standpoint is strength training.
- In this case, Dez, my friend Dez Desfitit, you can find his YouTube channel and his circa content linked down below somewhere here, uh, went out and did a bunch of different strength training workouts, many, many workouts in fact, uh, using both the armband as well as the wristband.
- The first one right here is this workout where it starts with two sets of lat pull downs.
- And then after that we have arm curls and then shoulder press and then ending with a row.
- You can see again starting off the very beginning the first 2 minutes circa on the wrist kind of bobbles the ball a little bit and then it settles down and is largely fine.
- The other thing to keep in mind here is you look at the actual heart rates themselves we're talking between 100 110 beats per minute which is super low in the grand scheme of heart rates compared to like a running interval workout or a cycling workout.
- In the case of Garmin in particular, it's not going to have much of a difference, if any difference whatsoever, on the actual training load or even calories at the end of the day.
- Versus if you had something like we saw on the running side where it was missing it from what should have been 175 down to, you know, 130, that kind of range, that is a huge impact on training load as well as a huge impact on calories and all the other metrics behind the scene.
- The point being outside of those minor errors briefly for a few moments either on wrist and then very more rarely on the bicep, it was pretty good overall and generally in the same ballpark as all the other devices whether they're worn wrist or bicep.
- It's not workout heart rate that matters.
- Now, I'm going to dive into more of this in my full in-depth review coming up in the next day or two, but I will dive into the accuracy piece of the automatic detection.
- The first one is you can use your phone to manually start something as well as use the button on the side of Circa which is unique to Circa.
- The second option is to use automatic detection, which means you just go out of the garage, start running, and then hopefully within a very short time period, maybe 20, 30 seconds or a minute at worst, it figures out you're running or riding or whatever it may be, and detects that workout and starts to increase the optical heart rate sensor power to give it higher fidelity workout data.
- In the case of Garmin, they only collect that higher fidelity workout data during a workout. versus Whoop and Fitbit, they're not only logging that data 24 by7 to higher fidelity, they're assigning your training load, in the case cardio load for Fitbit or strain for Whoop, based on the entirety of the day.
- If it ends what it thinks is that workout in automatic detection, let's say it thinks the workout's 45 minutes, in reality it's 60 minutes, then you lose that heart rate data for the last 15 minutes and there's no getting that back.
- So, this is why automatic detection is one of the most important things, if not the most important thing on this device.
- Only a few of them were actually automatic detected versus they were all detected by Whoop and Fitbit, but not so much my Garmin.
- That's because mostly automatic detection happens after the fact, and it happens on the phone in the Garmin Connect app, as well as some back-end platform stuff.
- Even though once we got down that initial descent, I then had more climbing and more flats to do, including some pretty high heart rate sections that it missed entirely.
- And then you lose the heart rate data for the rest of it.
- In this case, it was really good on these.
- Now, the one caveat, and most of them did kind of the same thing, is Garmin would tend to pull in more of my walking portion to the start of the run.
- I usually start my runs like 4 to 5 minutes away from my house or whatnot, and I'm just simply walking casually there, then I start running.
- In the case of Garmin, it includes that walking portion at the beginning of the workout, but it also allows you to very easily just trim off that front end and you're good to go.
- It basically stopped within a minute or two. like really really good job on that one.
- Uh in this case, it started about 6 minutes later or so during this really gradual uh buildup of a warm-up there.
- So, kind of really easy and then once it caught in, it was good for the rest of it and then it ended within like 30 seconds of me getting off the bike.
- This is one of those activities where just it's so gradual at the beginning that it's hard to detect.
- That could be yoga, strength workouts, etc., where from a heart rate standpoint, it's not going to escalate super high.
- Next, my wife and I did a 1-hour walk, just not like a super brisk walk, just a medium paced walk out at night here.
- In this case, it took about 4 minutes from when I started the walk to when it started the walk.
- So good job there.
- So good job there.
- Then Garmin kind of is good but getting better.
- There was numerous times during my interval workouts with just a 90 second recovery period where the maze would be like nope you're done workout complete and you'd see it like trip and go ahead and start again and kind of a mess and then polar [sighs] yeah polar.
- Now next when it comes to accuracy sleep data I'm going to focus on four basic things.
- The first is what time did I go to sleep, what time did I wake up, and then the duration with that.
- Uh, so those are like the most important things when it comes to sleep.
- Uh, sleep scores are all different by company, so you really can't compare them, but it's good just to like give a general swag of how different those are.
- That'd be things like REM sleep, deep sleep, awake, etc.
- And did it get the time I went to sleep and the time I woke up correct?
- From there, we'll start off with the sleep times.
- The general trend here is for the most part, Circa tends to get it right on the wrist most of the time within 5 minutes.
- So good job there.
- But having worn the Whoop for like six years now, and having worn all the different devices for the full duration since the day they were out, I can tell you that on the whole, it's kind of a wash for me, at least from my data, they're all basically going to get things wrong every once in a while and get things right the vast majority of the time in terms of the time I went to sleep and the time I woke up, which what you're seeing right here.
- In general, it tends to get the time I woke up like almost perfect every single time because usually I'm getting out of bed and going somewhere versus I go to sleep and I lay there on my phone like you're not supposed to do and I read something for a while and then I fall asleep.
- Now for durations, as you can see right here, there's no reference of course cuz we don't know the awake time if I went to the bathroom or a kid screamed or whatever the case was that I had to go sort out.
- That's probably the most interesting thing here at the end of the day.
- When I have lesser uh time, like that first Tuesday to Wednesday there, and I wasn't sleeping any hours, that was I think less than 5 hours that day cuz a bunch of things going on trying to get the house all packed up versus later on when I'm now here on vacation of sorts.
- As for HRV data, here is HRV data on a chart comparing each night and the overall score for each one.
- Virtually all these wearables at this point in time will simply give the total average of your HRV value for the moment you went to sleep and the moment you woke up.
- How they assign the awake time is where you tend to get some of these differences here.
- The two outliers is Fitbit tends to be a fair bit lower than the rest and Amazfit tends to be a bit higher than the rest.
- In the grand scheme of things, the actual accuracy of HRV data is probably the least important of all the accuracy sets because all these companies establish a baseline to you.
- This is boring, but I happen to write them all down, so they're all basically the same.
- In the case of my set test, I just simply walk out 250 steps, then I walk back 250 steps on pavement with some slight ups and downs, but basically relatively flat.
- You can see the results here.
- But as you can see from my daily totals down here, they're all going to be different every single day.
- You can see here these three different days just very briefly.
- Uh, one day was London as a tourist.
- I went with the family on a one-day layover we had uh coming here to Canada.
- Another day where I did an interval run, the 10k interval run I had, and then was kind of lazy the rest of the day.
- So, you can see those numbers there. and the third day where I had a three-hour bike ride and then some errands and things like that afterwards.
- The first one is the full day calorie burn.
- Again, the same three days, the London tourist day, the interval run day, and then the gravel bike day.
- The general trend here I see is that the Garmin Circuit tends to be a little bit lower than the kind of median, if you will.
- The Polar Loop though tend to be about 50% higher than everyone else on all of my individual workouts and outside of the 5 calorie one anyways.
- It's all the same, but this one consistently is giving me way higher calorie counts for individual workouts.
- Well, in general, Garmin Circa is kind of like in the mix of all the other ones.
- They're all in basically the same ballpark for all these different categories.
- Instead, I think probably the biggest thing that Garmin needs to work on at this point in time is their automatic workout detection piece.
- In the case of both Fitbit and Whoop, they can kind of skirt that issue a little bit because the fact they recording their heart rate at a higher fidelity and also assigning that heart rate into their strain or cardio load buckets 24 by7 versus Garmin is only giving you that training load when you actually have a workout defined either using automatic workout detection or manual.
- So when the automatic workout detection fails, then you lose that training load.
- I think it's something they really need to figure out how to address, either by tuning that algorithm or just turning on a higher fidelity heart rate nearly 24 by7.
- By just simply pressing the button, you can start that workout, end the workout what you want, and you know, you've captured the whole thing.
- It's enabled Garmin to kind of put this by the wayside and not focus as much on automatic detection versus the others don't have the button and thus have to figure that out a bit more behind the scenes or at least allow you to correct it after the fact because the data is still there.
- General rule of thumb, and this is true across all these devices and all of my testing, the bicep will almost always produce more accurate workout heart rate versus the wrist will generally produce more accurate daily stuff.
- Uh, especially for someone like myself that tends to be on the phone when they go to bed at night first, just being on the phone like this, your bicep rarely moves and it may think you're still asleep or you've begun sleep versus the wrist tends to move a little bit and most these wearables detect the fact that you're not quite yet asleep.


### REPETICIONES. Conspiración en el Gym
https://www.youtube.com/watch?v=syba0b4jBeE
## Puntos densos

- [música] Muy bien.
- Vamos, chicos, vamos.
- Vamos.
- Muy bien, chicos.
- Recuerden, 12 repeticiones exactas para llegar al éxito. [música] [música] Vamos, chicos, que los veo hoy como flojos. ¿Te has fijado que siempre son 12?
- Ni una más ni una menos.
- Es una rutina, Fermín.
- Vamos, Juan, mantén esas paregida, si no la ella no va a registrarlo correctamente. la máquina me está pidiendo más resistencia de la que puedo dar.
- Esto no es un mero control sanitario, nos están entrenando para algo más.
- Preparación de la fase uno completada.
- Están reclutando un ejército senior.
- Vamos equipo, los veo muy perezosos.
- Vamos, 12 repeticiones más.
- Vamos, a mí no me la van a dar estos.
- Vamos a bajar el peso.
- No nos están entrenando solo para fitness, están entrenando para hacer soldados longevos.
- Soldados senior, sensores, emanaciones, [música] esto es demasiado.
- Fermín, por favor, completa la repetición número 12 para completar la fase dos.
- Fase dos, eso es lo que quieren que haga, pero ya no entro en su juego.
- Preparación de soldados senior 78% completado.
- Ajuste de resistencia automática activado. [música] [música] Ahora que sabemos la verdad, cada repetición cuenta para decidir si obedecemos o somos la oposición.
- Pues para ser un ejército senior me siento mejor que a los 20.
- Nos vemos mañana para terminar la fase de resistencia.
- Fase de qué?
- Fase uno de reclutamiento finalizada con éxito.
- No habrá más simulacros. [música] [música]


## Strong app vs Hevy app comparison

### Hevy vs Strong Which Workout Tracker Is Better
https://www.youtube.com/watch?v=X4crgqRYe7w
## Puntos densos

- Heavy versus strong, which workout tracker is better?
- Heavy and Strong are popular workout tracking apps designed to help you log exercises and monitor gains.
- Heavy is a workout tracker designed to combine exercise logging with a strong social community.
- Heavy is ideal for users who thrive on social interaction and want a dynamic platform that goes beyond just logging workouts.
- Strong is a workout tracker that emphasizes simplicity and detailed data for strength training.
- Unlike Heavy, Strong does not focus on social features, making it a more private and distraction-free option.
- Strong is best suited for users who want a no-nonsense app focused on tracking strength gains and optimizing training without social distractions.
- Strong, on the other hand, focuses on workout efficiency and data accuracy, ideal for users who prefer a streamlined private experience.
- Choose Heavy if you want a workout tracker with strong community support that keeps you motivated through social engagement and shared fitness goals.
- Opt for Strong if you prefer a clean, distraction-free workout tracker focused on precise strength training analytics.


### I Tried the HEVY APP for the First Time at Planet Fitness (LIKES & DISLIKES!)
https://www.youtube.com/watch?v=z52fyFSQbLY
## Puntos densos

- In today's video, I'm going to show you what it's like to work out using the Heavy app.
- I'll be doing a full review and tutorial after I've used it for a few weeks, but I wanted to share my first impressions and show you exactly what a workout looks like using the app.
- For this workout, I selected one of Heavy's pre-made push routines.
- You can create your own routines, but I wanted to see what the app already had programmed.
- This workout is part of a push, pull, leg split, which is great for beginners because it covers all the main muscle groups throughout the week.
- When I started the workout, it kicked off with a warm-up.
- One thing I noticed right away was that my Apple Watch automatically synced with Heavy, allowing me to see my workout progress directly from my wrist.
- The timer appears on your phone, your Apple Watch, and even as a live activity on your iPhone's home screen, which is a nice touch.
- Once the timer ends, you're ready for your next set.
- For this workout, I completed three sets of dumbbell bench presses, three sets of dumbbell shoulder presses, three sets of the pec deck machine, three sets of dumbbell lateral raises, and I had originally planned to use a specific tricep machine, but it was occupied.
- One thing I noticed is that when replacing an exercise, Heavy doesn't automatically suggest alternative movements [music] that target the same muscle group.
- After finishing the workout, the app provided a summary showing my total training volume.
- I could also add a photo and share that workout publicly because Heavy isn't just a workout tracker, it's also a social platform.
- So, that was my first experience using the Heavy app.
- What I really liked about it was the pre-made workout routine, >> [music] >> the automatic rest timer, the social media features, and the ability to track your workout history and personal records.
- Since the app already integrates the Apple Watch, one feature I'd like to see is automatic rep counting, which is present on apps I've seen before such as Train Well.
- After my last strength exercise, the workout just kind of ended.
- The workout was easy to follow, the app was intuitive, and I think beginners could really benefit from using it.
- Until then, are you going to use the Heavy app?


### Why Everyone Is Ditching Strong & Hevy for This Free App (Boostcamp Review)
https://www.youtube.com/watch?v=HxNSJCL3DRQ
## Puntos densos

- After 5 years of using the same few workout tracking apps and trying to find the best one, I finally found the best free workout tracker that you should be using if your goal is to maximize your progress in the gym.
- And in this video, I'm going to give my honest review of Boost Camp and break down all the features that I've been using to get the most out of my training sessions.
- By the time I'm done explaining everything, you'll know exactly why this is the best free gym app on the market and have a solid road map and how to get the most mileage out of all the features offered.
- So, one of my favorite things about this app that immediately got me hooked is as soon as I finished creating my account, I was immediately greeted by this program screen that has thousands of pre-made workouts that you could immediately access for free.
- Every single kind of workout from hypertrophy base, strength, hybrid, at home, anything from 3 to 6 days, it's all here. beginner level workouts, intermediate, advanced.
- And let's just say I want to go in and do some sort of like low volume, highintensity program, cuz that's kind of what I'm into.
- And then before you dive into the workout, you'll see exactly what it entails and then know if that's right for you.
- So, unlike all the other apps I've used like Stronger Heavy, I can immediately dive into a pre-made program for completely free and it's available as soon as I finish signing up.
- And as you can see here at the bottom right, there's a community tab which directly ties into all these programs that are outlined here.
- And for example, if you're a coach like myself and you have clients that you're taking on, you could have them follow you and see what workouts that you're doing.
- And then on the contrast, you could also follow them and see what they're up to as well.
- And then, if you're doing some sort of Olympic weightlifting movement with an Olympic bar, you can select this with empty bar feature.
- That way, you don't have to type in 45. you just have the empty bar ready to go and then you could also do some sort of alternative as well or add your own kind [music] and then it's completely customizable and you could add this on to any workout that you do and unlike other apps I've used this is the most customizable one yet.
- You can also go into your weight units and measurements which the weight measurement and distance measurement is pretty standard stuff but the smallest weight plate option is something I really like.
- And just like other apps, you can link it directly to your Apple Health, which really helps when you're using the fitness app all the time like me.
- And it helps when you're doing certain workouts that are burning certain calories, and you can kind of integrate that into what you already have going on on your other apps.
- The key takeaway for everything I've gone over so far is I've used this app to kind of replicate my exact approach, and I want to just pick up where I've left off on the program that I was already following.
- And with doing that, it allows you to be able to pick up where you left off without having to follow some sort of pre-made plan if that's not something you're into.
- And once I start using the pro version of this app more, I really want to make another video delving into those because I really think it's something that's worth everyone's time and it's something I could see myself getting immediate value out of.
- And then when I was using Strong and Heavy, I noticed that Strong only allowed me to have about three workout templates and heavy only allowed me to have four for free.
- Whether it's your own, whether it's from a coach, whether it's something you found from a user, you could just save as many as you want in your library and access them immediately.
- And yeah, Boost Camp has all these free programs and apps like Strong and Heavy simply don't. [music] So that already makes me want to keep using this app much more.
- And as you can see here, you can kind of go to your training and not just follow your own program, but you can just start an empty workout from scratch.
- So that's something I really like about this app is just being able to jump into an empty workout.
- I don't feel pressured into having to download a program or create my own.
- If I'm doing some sort of rehab work, if I'm doing some sort of cardiobased movement, if I'm doing mobility work, anything doesn't have to be specifically for lifting weights, I could log it here and see what I'm doing.
- It's so easy to access and I don't feel like I'm pressured into using anything that's a feature on this app.
- I feel like I have the agency to be able to use the app how I want to and I don't feel restricted in that.
- So, the next thing I wanted to talk about is how I specifically use this app to create my own personal program and why it makes training going forward a lot easier having this specific layout.
- So you can put in your body weight and then kind of put in your maxes for everything you've done across your lifting journey and then see how that compares to other people in the gym on a relative basis if that's something you're into.
- And that's something you could obviously optionally do and [music] it's not something you have to focus on if you don't want to.
- And then the next thing I wanted to go over is my specific hypertrophy program that I built that I'm giving away personally on here.
- And I'm going to break down exactly what this program is and how you could use it in your own life if your goal is to build muscle.
- So, one thing I really like about this app is how I'm able to get into the specifics with the program that I'm making.
- In this overview, I kind of just summarized the program and it's low volume, highintensity, hypertybased, designed to be completed four to five days a week with a dynamic 8 day a week split based on 3 days on and 1 day of rest.
- Your muscles don't really know the days of the week.
- I'd say it's intermediate level because as a complete beginner, you don't want to be jumping into low volume, high intensity that requires you to go all out failure for every single set.
- And then like I said, frequency, I just have it 3 days on, one day off, and then it just kind [music] of repeats.
- But you could obviously see it on here and then when I also share the program with the link in the description, you can read it and see if it's right for you.
- But as you can see, you can go down here and see it's a pushpull legs and core followed by active rest. and then push pull legs core followed by active rest.
- So for example, you could see that this program prioritizes triceps and upper back the most.
- But what I could do is in the future I could follow this program and then do another program where I adjust the volume where I'm kind of cutting a set from triceps and then cutting a set from upper back and then maybe adding more sets to bias my lower back and calves because calves are a muscle you could add more stimulus to without having to interfere with recovery.
- And then I could also add more sets to my lower back.
- And it's really interesting to see what muscles that I end up biasing the most and what muscles I've been neglecting so I can adjust it in the future.
- And after using it for about a week or so, I'm confident in saying that I'll probably never go back to any other workout tracker like Strong or Heavy after figuring out how much value I've already been able to get out of just using it for a week.


## app que genera rutinas automaticamente

### GitHub Copilot genera HTML automáticamente cada día remotamente desde tu navegador | Rutinas IA
https://www.youtube.com/watch?v=LzMAkxOC4Zo
## Puntos densos

- En el siguiente vídeo vamos a crear una rutina en el que vamos a ejecutar diariamente una tarea para agentes IA.
- Esta rutina se suele hacer normalmente con cloud, pero en este caso vamos a crearla con Jitha copilot.
- Gracias a Control Note vamos a poder crear esta rutina desde nuestro navegador accediendo a los archivos físicos de nuestro ordenador local.
- Vamos a ver un avance.
- Heo [música] [música] Bien, vamos a empezar creando un proyecto, en este caso mundial YouTube. y vamos a elegir el tipo de agente, como hemos dicho, copilot.
- Vamos a elegir las nuestra carpeta de trabajo, en este caso mundial y vamos a crear nuestro proyecto.
- Lo registramos como por ejemplo con el nombre agente mundial y vamos a elegir el modelo, en nuestro caso Sonet 46 y le damos a crear agente.
- Y vamos a crear nuestra primera rutina.
- En este caso, como hemos dicho en el principio del vídeo, vamos a crear una rutina que sea mundial. la descripción resultado de los mundiales y vamos a empezar con las instrucciones.
- Vamos a elegir el tiempo de programación, en nuestro caso, nuestro ejemplo, diario a las 9 de la mañana. [resoplido] Esta es la descripción de nuestra rutina.
- Como no vamos a esperar en este vídeo, vamos a ejecutarla de manera manual para que comprobéis cómo se realiza la ejecución.
- Si pensamos en el de la tarea, vemos que está en progreso, cuál es su modelo, el cloud Cloud Sonet, y vemos cómo se está ejecutando.
- Ahí podemos ver el directorio de trabajo y si pulamos vemos que todavía no hay nada porque está ejecutándose.
- Vamos hacia atrás.
- Si vamos a su workflow podemos ver en el apartado de definición cómo está ejecutándose y los workflows tienen las ejecuciones.
- Vamos a ver cuál es el resultado.
- Vamos a pinchar en la vista de ficheros y vemos el resultado.


## autoregulation training app

### WHY YOU NEED TO LEARN ABOUT AUTOREGULATION (FBEOD)
https://www.youtube.com/watch?v=4mEH_10RTm8
## Puntos densos

- All right, I got to come clean.
- Okay, I'm just getting ready for the gym.
- Um, no, I'm just playing.
- Um, just about the the whole when I was talking about yesterday trying to maintain your relative body fat percentage, I used that if you gained 2 lbs and you gained one pound of muscle, one pound of fat, you would maintain your relative body fat percentage.
- That would only be true if you were 50% body fat and obviously you are less than 50% body fat.
- So the better calculation, the more accurate calculation is for in for in for instance if you are 15% body fat or 20% body fat.
- The amount of fat that you gain to muscle has to be in relation to your current body fat percentage.
- So if you are 15% body fat and you gain one pound of weight over the course of x amount of time, then for you to maintain your relative body fat percentage, you want to gain 0.15 lbs of fat to 0.85 pounds of muscle.
- But what's your name again?
- I don't know if I can vote for Norway cuz I want like I'm part English and I kind of want to see it come home.
- The direction of what I was trying to say in the sense that to maintain your relative body fat percentage, you're going to be putting on fat and muscle.
- It's just the proportion of each is going to dictate your relative body fat percentage.
- And then if you want to take into account body recomposition, then you're going to shift the scale in which you are gaining muscle to fat even more.
- All right.
- You know what I mean?
- All right, we're going to put our drinks here.
- I'm going to slam my pre-workout early today because I find that it gives me a little bit more a little bit more oomph in these in these little episodes here.
- But of course, the most important question of all is, how are you guys doing?
- What are you doing?
- Are you reaching your goals?
- I'm ready to honestly lift.
- I'm going to the gym ready to lift.
- I'm pumped.
- I'm pumped.
- All right. with with all this kind of yapping going on with the whole like reps and reserve and 5050 reps and all these things, they incredibly important, don't get me wrong.
- Um, but with all of that in the back of your mind, the number one goal is to beat the log book.
- Attack your goals with velocity, ferociousness.
- Oh, I remember yesterday or two days ago at the gym, I smoked the back of my heel on a bench and I was bleeding out.
- Um, I'm ready to go.
- I don't know what that was.
- I'm I need Echo to send me out some more pre-workout.
- I'm I'm I'm I've got like four more sessions in me of Dethroner.
- I kind of want to try a different pre-workout to be honest.
- And don't get me wrong, it's the best on the market, most stacked, but I don't know.
- I kind of want to try something different just because I mean like once you understand once you understand that it's just caffeine really um that's what's actually going to improve performance in the gym then the type of pre-workout and all the other ingredients become very second to none.
- So just to save yourself money uh dethroner is great and don't get me wrong there's still going to be added benefits.
- There's a lot of stuff that I talk about every single day and sometimes I don't I don't think about the numbers specifically, but one thing that I do try to nail is the the mechanisms and the actual underlying kind of direction of what I'm trying to say.
- But yeah, anyway, what if what if I was talking about your people who are 50% body fat?
- I just, you know, when a show is so good that it only comes out once a week and you watch the episode and you're sitting there like, [ __ ] I have to wait an entire week for the next episode.
- See, I got called out on on my [ __ ] I'm telling you guys to drink your pre-workout an hour before the gym, and I'm drinking it like 5 minutes before.
- So, it's time to put my money where my mouth is and take my own advice.
- And plus me taking the pre-workout now, it's going to start to kick in a little bit about halfway through the drive and we'll yap like crazy.
- I think I'm good.
- Seriously, when when you have that when you have that drive to train, it's Oh, I love it.
- You can you can kind of hold it for a little bit, but especially if you have been dieting for like, you know, a couple months, maybe a month, maybe two months, you start to lose that drive.
- Now, I remember back in the day when I was eating, that's that's usually why people like to to talk about surpluses and stuff like that.
- Um, now how that correlates to whether or not you build more muscle in my opinion and what I've seen, no.
- And when you diet, you're going to again lose that drive.
- So the goal is now is to just hold your body weight uh relatively close.
- Um body fat percentage body weight like yes, your body weight can climb, but your body fat percentage is ideally going to stay the same.
- Honestly, this was back when I was doing like push, pull, arms, legs.
- Like that's the last kind of I did push, pull, arms, legs.
- Um, second longest running split was upper lower and then third longest running split was actually, you know what, full body is now my second.
- It it went like it went like bro split then it went push pull legs then it went like upper lower then full body every other day and then push pull arms legs in terms of like how long I've actually ran the split and what pushpull arms legs is what that's like is that like 1.5x frequency?
- I can't do the math but I'm sure you guys help me with the math right now.
- I don't know what that is.
- I think that's like one point I think it's like one less than 1.5x frequency.
- I'm telling you, like he was the best person I could have ever found in the midst of my like bodybuilding or like I don't even know what you call it, right? just training career because he would teach you the fact that frequency matters.
- Uh even though he doesn't even use low volume, it's just like low volume per muscle per session.
- Uh but because you're training with a higher frequency, the volume ends up in that in that right spot.
- But uh I mean before he would have kind of weird takes like oh get strong at all rep ranges but he doesn't really think about think like that now.
- I'm just saying my interpretation of what he has to say and and what I believe that he believes.
- And push push days, it was always you start with a low incline press, right?
- And then you go to a high incline press.
- I believe the rep ranges was like 5 to 8 then like 8 to 12. uh just completely arbitrary like all I'm just thinking back to what I used to believe in.
- Um obviously like I used to believe that you genuinely needed a surplus to grow like not even not even to maximize growth but to literally grow like to actually build muscle.
- It would be like low incline press.
- And then next one would be like high incline press.
- The idea was you're trying to bring up that top line. that top line being your upper chest, your front delts, your side delts.
- Um, but again, it had like there was none of this kind of, oh, you want a tucked arm path to bias the shoulder flexion component to hit more of the fibers that hit, you know what I mean?
- And then so you do the same thing for the the high incline press.
- You do two sets like 5 to 8, like 8 to 12, and then you would do a tricep compound, right?
- And then after that, you would do a fly.
- You do a fly for like two sets, uh maybe even sometimes three sets.
- And then you would do a lateral raise.
- It's it's not even a it's not even a science-based movement.
- Um, and then and then it would be like a push down and overhead extension or like a it would be like a a crossbody with two cuffs cable extension and then like a skull crusher or some type of overhead extension.
- And that would be the push day. um like two to three sets per exercise, like five to eight reps for like the the main top sets, and then like 8 to 15 for like the the back off sets.
- And even that same kind of concept, the same like exercise selection, I would still do even on um on all of the splits that I've ever ran. like even on upper lower on upper days I would still take those those all those exercises and I would still run it.
- I would do like flat or low incline, high incline, tricep compound, tricep extension or isolation, uh chest isolation, side delt shoulder isolation, and then I tricep isolation.
- So it' be like chest compound, shoulder compound, tricep compound, chest isolation, shoulder isolation, tricep isolation.
- And then I would do the same thing on full body, right?
- I do think that there's value in uh in getting strong at a tricep isolation like a tucked really getting that that elbow extension more so than shoulder flexion.
- And then we'll run you guys through the pull day.
- The pull day was pretty much um I wouldn't train arms.
- Push pull arms legs.
- And then after that, I would go to lats because it was always harder to get the lats short early on in the session or later on in the session than early.
- I didn't do any frontal plane movement, any wide grip movement for the lats particularly.
- I was tapped into upper back pull downs because a lot of JP's old training was influenced by Cass, Coach Cassm, and uh that's what they teach over at N1 is like upper back Terry's pull down thing like that.
- Uh do I necessarily agree with the Terry's pull down?
- Um but yeah, then it would be like a narrow grip pull down, narrow grip row.
- So the idea here is kind of something similar to what I was talking to you guys about like other sessions where you would have like a a unilateral cable pull down, which to be honest, this was before JPG made this popular. um like N1 and people have been doing like unilateral cable pull downs for forever and the same thing with unilateral cable lat rows.
- And then you do one where you have the cable coming from above um you know around that 120 degrees 130 140 degrees of flexion.
- So you're you're queuing that depression plus extension umh for for the pull down movement and then you have a like a rowing movement where you're queuing more like depression extension and then a little bit of retraction just to train more of those fibers that run horizontally.
- Um it's it's kind of up in the air really where does it does it really matter if the if the line of pull is going to align with the the fiber orientation of those particular fibers that run horizontally or is it just the fact that because you're training shoulder extension in the sagittal plane they're they're going to be trained adequately right like that's kind of a that's kind of a nuanced topic to be honest uh we just don't really know so I mean to be honest You could you could tick your boxes and just do all three, right?
- There's no again, if you're training full body, full body every other day, and you want to uh do three sets for your lats, because like we like we always talk about, that's going to be kind of around the close to the max that you're going to be able to recover from, then why not just do three exercises, one set each.
- Do a a wide grip movement, do a narrow grip pull down, and do a narrow grip row. you tick all three boxes, you have the potential for that that additional benefit of the the fiber orientation aligning with the line of pull.
- So I would do pull down row and then I would do like upper back upper back row.
- It would be like a a chest support, a T- bar row, and then I would do like uh upper back pull down, which was just ridiculous.
- And then I would do a 45 degree row.
- I would do a rear delt row because the idea was that the the fibers of the rear delts run at this like oblique or like 45 degree angle.
- So if you like uh rode with um a 45°ree ang like abduction, you would be training more of the rear delts, which to be honest, I don't even think is like a I don't think it's like a necessarily a fiber alignment thing.
- I think that it's more so you can row for the rear delts. um based on like think about it the lats they're going to be very strong depressors um specifically of the shoulder girdle.
- So that's why whenever you're training lats you're trying to have that simultaneous shoulder extension and depression of the GH joint.
- Um, so if you just have the extension, that's where it's kind of like this again this like unknown thing that people are always arguing about that is that going to train the rear delts more.
- I personally think that the rear delts uh and the lats are going to be trained uh pretty adequately regardless if you are queuing this depression or not and you just have the the the main joint action being extension or adduction but it's just something to take into consideration like it's something that's interesting but uh yeah and then I would do the rear delt row and then I would do like shrugs uh vertical shrugs and then I think kel shrugs too something ridiculous and then I would hit arms arms.
- Then it would be like a JM press, like a banded JM press, and then like a hammer curl.
- And then I would do like wrist extension and wrist flexion for my for my forearms.
- And then the the leg day, it would always start with like adductor or it would start with calves. always start with calves and then adductor lying seated hamstring curl with uh some type of thrust, some type of hinge and then quads would always be at the end.
- Um it would be like leg extension and then like leg press and then it would be always two squat patterns.
- It would be like a squat p it would be a leg extension to start and then like a squat pattern like a Smith squat, hack squat, pendulum squat and then a leg press.
- It was leg extension, then leg press, then the squat pattern, and then that would be that would be the end.
- And I mean, even back then, this is the this is why I'm such a big proponent of full body is because even back then, like again, JP was my biggest mentor.
- Um, he would always make videos and say like like what what if someone's asking what split should they run?
- Like full body, that's what they should run cuz that's what they need because you're small and you're weak and everything everything needs to come up and the best way for it to come up is with higher frequency.
- Um I I don't want to train full body.
- So anyway, I'm going to have a fantastic session.
- I think it's going to be a great game.
- I wanted to see that go to extra time, but you know what?
- It's it's an absolutely amazing Saturday.
- Um the irritability today, especially like in the gym and post training, if you even breathed near me, I was going to bite off your ear metaphorically in game.
- So it's all good, you know.
- It's not always going to be sunshine and rainbows, but uh today I just wanted to absolutely attack [ __ ] So, we definitely made some poor training decisions.
- It's not that big of a deal.
- And you're going to see on the leg extension, I know I touched on the last training session, I wanted to get back to my all-time PR of hitting five plates on the top peg, and we just did that.
- Because obviously, this is a relatively newer movement for me.
- So, I definitely had some kind of room to really push and now I'm probably going to be stuck at that point where progressions are going to come a lot slower, but that's perfectly fine.
- Although these uh overhead extensions were kind of messy, um I'm okay with it because they're not the absolute worst.
- It's just going to alter the movement.
- Um it really comes down to preference and again how well you're able to stay with the same relative technique session to session.
- So, because I'm leaning into the weight, I'm having the weight pull my upper arm backwards, which kind of allows for that counter force as I pull my my elbow into extension, if that makes sense.
- So, obviously, I'm not using like a preacher curl pad, but I'm utilizing the weight pulling me back to hold that that humorous in flexion.
- It's it's more of like a I don't want to say like an advanced training technique per se, but it's when you when you can stabilize a movement so well to the point where you don't really have to worry about uh safety and you don't have to really worry about any kind of other joint actions occurring, you could really just go to town and you could just be as explosive as possible.
- And that's kind of what I'm showing in this movement.
- It's also maybe because I didn't rest adequately between arms.
- Um especially when you're really giving it your all and you're training to failure.
- Um it's definitely going to aid in in that fatigue, especially uh contrateral, which I'm pretty sure means opposite limb.
- I'm literally getting Oh my gosh.
- This meme where it's like Tyler Voss, this testosterone accelerator.
- I literally just got like 15 notifications on my phone for the video that's what rate of gain per month to maximize muscle growth and I have all of these bots in my comments.
- So, I'm just going to have to mute all of those people unfortunately.
- It could be because obviously I was pushing myself a little bit now that I'm returning to to maintenance.
- Um, but I don't think it's that.
- I just think that genuinely I'm just very very stressed and I have a lot of things that are going on right now.
- But again, I'm not too fussed on keeping these 100% strict with my humorous uh not moving a touch.
- I kind of like some some movement.
- It's just my preference in hitting the movement.
- Um, but yeah, those definitely need cleaning up a little bit, but instead of me lowering the weight, I'm probably just going to stick there because they're not too bad.
- Um, and it's making me not want to do the Q& A's anymore.
- And the reason being is because look, like I do this out of obviously enjoyment, but I also do this because I want to help you guys.
- And there's some questions that genuinely it would require me too much time, too much of my time to be able to help that individual and then it's just unfair completely for free.
- Um and it's just like when I respond and say apply for coaching, it's either because a the question is ridiculous and it requires more nuance or b I just genuinely don't want to answer that.
- Um, and you could say that, "Oh, well, why don't you just not answer the question or why don't you just ignore the question?" Well, I have a hard time ignoring things.
- Um, and that's why I appreciate it and that's why I continue to do what I do.
- But there are quite a few people in the comments that I will um, kind of, you know, go out of my way to answer their questions in Q&As's, but then when I decide to drop and apply for coaching because this is literally my business, they get upset and they'll say like, "Oh, like you're just another one of these." Like, it's just I don't know when I when I read stuff like that, it really makes me not want to do the Q& A's.
- Um, so just know that if I do decide to stop um over like all of a sudden, it's because of that stuff.
- So I just feel like you you don't understand what you're getting.
- Um and when I dropped the apply for coaching it's like I said it's either because the question requires more nuance to the point where it would require like individualized approach even when you don't think it does it does.
- Um or I just genuinely don't feel like answering it because it requires too much of my time to answer.
- Um, I didn't really want to do this video because I was just absolutely drowning in work and steps and and honestly like I really want to watch the McGregor fight.
- Pretty much everything was taken to failure today because I was just in that mood.
- Like I always said, if you're training with single sets, um it's not the worst thing to take your sets to to zero RA.
- Now, to go for the additional rep and to take that right, cuz there's going to be a difference between zero RA and momentary muscular failure.
- I've reiterated this and I've touched on this a million times, but essentially zero reps in the tank is when you complete a repetition and you I guess you can never know for sure if you have one more in the tank, but you are to the best of your ability um sure I don't know how how you would word it, but to the best of your ability, you don't believe that you were going to be able to get one more repetition with the same kind of uh criteria of the last rep.
- Now in an ideal world, especially when you're training this heavy because my preference when I'm lifting, I like to train in that kind of four, five, six rep range um with the occasional three every once in a while.
- Um you you definitely don't want to be training to failure because you just don't need to. the weight uh is so high that the effort required to move the load is so high which is going to indicate that pretty much you're going to have near maximum mode unit recruitment anyway.
- So the the added training to failure approach is really just going to kind of exacerbate recovery demands and take up more of your training session um in the sense that that acute fatigue is going to carry over through the rest of your training session.
- I'm not uh I'm not too fussed.
- Um, now as I said before with the flaps, if you're not used to it and you want to kind of incorporate incorporate it into your programming, make sure to stick to like the eight to 10 rep range to start just because you never train that joint action um with that much load in an isolated manner.
- And now I'm all the way to four.
- So, I'm I'm very pleased.
- I'm I'm happy to to do sets of four with the flaps.
- One of the variables that I like to adjust based on how I feel is my rep ranges, right?
- And what I mean by that is you don't have to feel so fixed and stuck in one rep range.
- Now, yes, theoretically speaking, in an unfatued state, you're only going to have, you know, maybe four or five stimulating reps.
- Because remember, hypertrophy is fiber specific, modun specific, whatever you want to call it, it's the same thing.
- So, the point that I'm getting at is if you don't feel the best or or a movement's not feeling the best one particular session across the week because of some variable outside of your control, um whether it's sleep, whether it's whatever.
- But, for instance, um there's nothing wrong with trying to beat your best ever six, trying to beat your best ever eight, trying to beat your best ever 10.
- So, if you're going in um every single session and say you're doing like five reps, five reps, five reps, five reps, and after a while you come into the session, you're like, "You know what?
- I don't really feel motivated to go after my five rep max, so I'm just going to go after my 10 rep max." There's nothing wrong with doing that.
- And it's a nice way to kind of spice up your training over time.
- Um and again, it falls under the same framework that I talk about all the time. um it's it's not quote unquote suboptimal, although it really just depends on how you define optimal, but there's nothing inherently wrong with doing so.
- Um and remember that the motivation could could persist over multiple sessions and the motivation can persist across the same session across multiple muscle groups because it might just feel very very good.
- Like if you've been training for a while, you know that you just had one set where you're like, "Wow, that felt amazing." Um, and it could just be at this different rep range.
- Yes, your goal is to beat the log book, but sometimes um you you might want to beat the log book at a different rep range, and that's perfectly okay to do, assuming that you understand programming and and fatigue, um accumulation, things like that.
- So, this set, um I did hit three reps again, although I don't want to necessarily go for three reps.
- And I'm very reluctant to wanting to drop the weights because these are three very, very clean reps.
- One could argue that I had an additional rep there, but I don't know if you guys pay too close attention to my training, but last training session when I hit that same weight, the third rep went up extremely slow.
- Um, so this time that third rep kind of flew and that is just another way of kind of assessing your progress because even though you might not add an additional repetition, your last rep might come up quicker, which can be an indication that you are progressing.
- Um, if you think about one rep in terms of like a spectrum, right, you're going to have the start, middle, and end, etc.
- Um, so I I hit four reps last time with this and then I hit uh three reps this training session.
- Um, I'll get it back next training session.
- Usually, what happens when I run into this scenario, like I said, that motivation plays a huge role, especially when you're training with these maximal kind of rep ranges because there is no there's no wiggle room, right?
- And you're going to be much more likely to have these these deviations in terms of your performance session to session if you are training with these really really low reps because it leaves little to no margin of error, right?
- I think I said some other [ __ ] last uh couple episodes ago, but you need to have everything kind of on lock for you to be able to perform at your best.
- Whereas, if you're training in like an 8 to 10 rep range, you have a lot more wiggle room because the percentage of the one rep max is a lot less maximal.
- And again, if you are someone that needs to see that progress every single training session and that is kind of what you deem to be a good training session, which obviously that's the goal, but it's not always going to happen, especially as you become more advanced and you're training with lower reps.
- Um, then training with slightly higher reps is going to be the key because you're going to see more rep progressions at a higher rep range than you will at a lower rep range. obviously because the percentage difference of the progression is going to be so much less so than it would be at a kind of lower uh rep number.
- But the thing is this is what you have to understand is that just because you can add more reps more frequently with a higher rep range like 8 to 10, 10 to 12, etc. does not mean you're progressing at a faster rate.
- Because if you take two people and you have one guy lifting in the four to six and lifting very very heavy and he's not progressing uh one rep every session, he might be progressing progressing one rep every four or five sessions or whatever it may be.
- But the guy in that's training 10 to 12 is progressing, you know, a rep every other session or maybe every session.
- Now, obviously, how are you going to be able to dictate your rate of progress or your rate of muscle growth?
- Well, it's it's best to do that via your strength progressions in the gym, specifically from the movements that you consistently hit every single day, right?
- So the point being is that although you might not be seeing as quick progress like on paper with your strength training with a lower rep range, I mean you still might because it's going to be less fatiguing, you're still growing at the maximal rate. um assuming that your volume allocation is correct and your frequency and all these other variables.
- I promise you the low rep ranges are the way to go uh for most people.
- I think I got four reps with nine plate and a 10.
- I really want to hit um did I say four plates?
- Four reps.
- I think my the most ever I've done on a barbell is like five plates or five and a half plates for like four or five.
- Five plates, single single leg.
- One thing that I notice is I'm so into the set and I'm not thinking about literally anything other than just moving the pad from A to B.
- It's your quads, right?
- So uh the people that say you don't have to move weights from A to B and you should like, you know, have a mind muscle connection and really like connect with your quads just I'm going to go insane.
- Because your left side of your brain controls the right side of your body, your right side of the brain controls the left side of the body.
- Um, I can't think of the exact word right now as of this moment in time because my brain is absolutely scrambled, but maybe that'll be a yap for tomorrow's uh video as well.
- It's just that the Q&A's might have to uh might have to take a little bit of a break just because I'm gettingounded.
- That's not That's not too bad.
- That's matching my all-time best for repper.
- Um, I'm very, very happy with that.
- But that's part of life and that's why I post all of my sessions on my channel just so I can give you guys a voice over of what's kind of going on in that uh in that head of mine.
- I'm not going to lie.
- Now, for some reason, there's added friction because before when I was doing this exercise, it was not feeling like this crazy sticky, but it's feeling very, very sticky in that mid-range for some reason.
- So, I don't know why that is, but honestly, I'm not too uh upset with these.
- Very, very happy.
- What are you doing with your glutes there, buddy?
- Um, I can't add any more weight here, so I'm going to be pushing up the reps, which is perfectly fine.
- Um, so essentially what I'll do is I'll I'll I'll push this up to like five or six, then I'll kind of figure out what I'm going to do from there.
- But that's going to take me a long time cuz like I said, it's a lot easier to microlo and add a small bit of weight than it is to go up an entire rep.
- Um, which is why I do believe that microloing is a valid kind of strategy for increasing motivation because sometimes you have not had enough of those adaptations um to allow you to increase a whole rep, but you might have had enough adaptations to increase a small bit of load.
- And again, if you are someone that is, you know, super super uh log book heavy focused, which can be a bad thing for a lot of people because it could lead to um you just chasing loads, pause that you have no business chasing uh or touching at this given moment in time.
- So, it you just kind of have to ride that wave and and it's a very it's it's a fine line between um you know, taking it a little bit too far um and as as I'm doing these absolutely egregious uh barbell 45s.
- I think I got like three and a half reps.
- Obviously, I don't count half reps over here, but um I really just don't want to have to microlo and go from like three plate 10 and a five.
- Um I'm just going to stick with that because it's a relatively safe movement for me.
- Um, again, I'm trying to hold that contraction at the top for like half a second just to ensure that I actually get to that position without utilizing momentum.
- Pause in the, uh, stretch position for like 2 seconds to essentially take your Achilles tendon, the elastic kind of recoil out of the equation and then just press about halfway with your calves.
- That's going to be the best technique for your calves, mainly the gastro.
- So, I'm definitely going to want to have a little bit more control next time, but I was just trying not to think about it and just I really want to get myself back up to like six plates on this. that would be amazing.
- Um, so yeah, that's a that's a big goal of mine that I'm going to be chasing down.
- It's not really like it's control eentric, but there is that kind of bounce out of the bottom, and that's what we want to avoid.
- Um, again with this, my goal is to pause my my hams on my calves at the bottom of the rep, but again, my adrenaline and aggressiveness this training session was uh a little bit much and then I failed at the bottom.
- So, and that's another thing I wanted to talk about is did I really fail or did I just [ __ ] out and not want to go for the grind?
- Obviously with me um reviewing training feedback on the daily like I've reviewed thousands yes no thousands of training clips from clients all around the world and you can tell when someone goes for the grind and someone bails out early because I honestly think that I pussied out.
- Um, and this is not me trying to be some corny like hard hardcore like, oh, you know, you got to you got to like gun to your head metaphorically in Fortnite.
- Like you get these reps or your your mom's going to die or something in Fortnite.
- And this whole culture of like only doing a leg extension and not doing your squat pattern has kind of created uh this mess of people where they they literally have like no drive and their their perspective of what task failure is is definitely different.
- I think if you guys remember Carter, he definitely doesn't watch my videos, but if he does, shout out Carter.
- Like there's another kind of theory that's no one really talks about.
- Um it kind of competes with Maror's model but it's a little bit kind of outdated but essentially you can train your perception of effort to to handle higher um effort essentially like you can train your maximum tolerable perception of effort if you're thinking about this from maroras and you do that I mean you can do that with stretch tolerance etc.
- Uh but that's another topic for another day.
- So anyway, um I bitched out.
- Peace out.


## deload week automatic training app

### Deloads & Tapering: Auto-Regulation, Common Mistakes, and Peaking for Competition Ep.9
https://www.youtube.com/watch?v=nvyvp6nk8zQ
## Puntos densos

- And also, we will start the coaching Q series since we've gotten very positive feedback about doing that with a combination of posting a few shorts and just talking about a few Qs that are more personal, more interesting that we've learned over years and years and years of coaching.
- We'll finish off the series talking about deloads.
- I feel like especially in the very advanced elite athletes, it's something you rarely see because people auto regulate their training a lot.
- And then there's one crowd that takes programs, especially in street lifting, from powerlifting that are very strict, very pre-programmed, where every four weeks you have to deload because it's written.
- So, basically, it's usually regarded as a week where you either do, you know, completely off training or you do a week of easier training.
- I think that that idea is a little bit flawed by itself, but uh since there's many ways to deload and nobody tells you that you have to take a week off or it has to be a week of easy easier training, that's not really how it's going to work.
- You can take maybe 2 days off, 3 days off, 4 days light training, so you can auto-regulate it a lot.
- So, they had like a structure, I believe, where they trained for 3 weeks and then they had a week off where they see their families.
- The only way they could make that work is to make those 3 weeks of training just a ramp up drastically with volume.
- And, you know, by the third week, you absolutely cook yourself, you know, make yourself miserable so that you can, you know, it actually takes you like a week to feel normal again.
- So, I think that's um that's actually how it came to life, the idea of a deload.
- Now, if you just try to copy exactly that without looking at hey, what's actually happening and you actually, you know, do very hard training for 3 weeks and then deal with for a whole week.
- Didn't really say much, but yeah, just a little bit of history maybe. >> Regarding deal loads, I feel like if you're someone who auto regulates their training a lot, trains a lot by feeling and learns to listen to the body and that's not something that's easy to learn, you can go ahead and train without big deal loads, no problem.
- Of course, if you work with a very structured plan where every single week you start progressively doing a tiny bit more.
- And then at this point, it makes sense to have and this can really be either a week or a few days where you train even lighter or take off completely.
- And here, for example, on the way I do this with my clients is in general, most people can go for four to six weeks without a problem, especially if you start off quite easy and over the weeks you slowly build up.
- You see since I feedback their videos every single week, you see how they move if the quality is degrading because that's one sign of the where you might have to deload as well.
- They they might feel still great, but you see that the quality of the movements are doing is drastically going worse and worse, or their sleep is off, they might have like things that were easier before start getting heavier.
- There comes a point where it makes sense to take some time where you go easier.
- I start with a very standard protocol just because that gives me a baseline and over time I like to individualize deloads for people.
- If they have just started working on a certain progression in a skill, I might even just leave the back off sets that's an easier progression rather than the main progression.
- Here, especially when working on skills, I have found that taking completely off for most people doesn't feel too great if they're not very advanced and very used to doing the skills because they don't train the motor pattern during a whole week and they come back and for the first week everything sometimes feels absolute That's also very individual.
- If I'm, for example, doing more bodybuilding kind of work, that's very easy and there's nothing great in repetition, I just take my time off.
- My deloads are doing more cardio and training less and traveling.
- I don't like that as much because I feel like it just brings more fatigue and confusion and soreness into the game.
- And in very intense and peaking phases for streetlifting athletes, I actually lower the volume, but I keep the intensity slightly higher just to keep the affinity to the loads still in the deload and trying to get rid of the fatigue by getting rid, for example, of all accessories.
- Then, there's people that just like to do 2 days, the rest of the days they take off or do other sports.
- And then, there's people who still like to keep the frequency the same.
- I also like to use the deloads to test things, especially for skills, not weighted really, but skills seeing after a few days where you went easier, where are you standing, how are the things feeling, is the work that we're actually doing working?
- You will very often see that deloads will happen or make sense around very stressful times because outside stressors make a huge difference.
- And usually, if you follow a strict plan and just want to follow through, you want to do a fifth week because everything's going well, is how people usually get hurt.
- It makes sense to actually keep this week a tiny bit easier training-wise because it's always like the drop that just makes the glass overflow and people get hurt from that.
- And honestly, that's it with deloads.
- Like every 4 weeks having 1 week that's a tiny bit easier if training is not everything they do is a right.
- Usually doing 5 weeks or 6 weeks and then having a week off is a better rhythm to progress for most.
- But as I mentioned, per individual. >> I have noticed that with people who are more busy, which is majority of my clients, they usually also struggle more with motivation, honestly, and adherence.
- It's not really the biggest factor that's going to determine fatigue, you know, just your intensity.
- But yeah, a great way to see where you are and because, you know, usually the way I program and you program, we don't really do much, you know, maximal stuff [clears throat] during the trainings, during, you know, the casual trainings.
- First one is deloading if you don't need to or you don't have a good reason to deload, or just forcing the volume that's going to force you to deload afterwards.
- If your program is going fine on the work that you're doing, just keep doing it.
- That's what I think, that's how I do it.
- So, instead of them doing their, you know, full planche with their body weight, let's say they do, you know, sets of 5 seconds, pretty intense, they have a couple of seconds in in reserve.
- Then, during the deload, they will take a medium band and they will just, you know, do sets of 15 seconds, 20 seconds, and thinking that's it's low intensity, but it's high volume, so we recover.
- So, if you want to deload, you know, maybe you can take on from there because I've been talking for for six six minutes. >> Like if somebody has an 8 * 3, for example, in their plan or 8 * 4, I'm going to drop to a 3 * 2, for example, or 4 * 2, but like really depends also on how high their RP rating was in the last week.
- And it's usually how then stuff just felt off or started hurting.
- You have certain people that have very interesting markers, like a certain thing starts like hurting a tiny bit or they're feeling some fatigue.
- Don't go and do 15 seconds, but like reduce the volume and reduce one or two seconds or just do the back-off sets.
- If you were doing an 8 * 3 in the advanced stack and two sets in a banded advanced stack, can also just do the banded advanced stack if you feel like your shoulders were very exhausted.
- See how you feel when you start again.
- So, in the first week after the deload, don't go too heavy.
- And then you will feel when it's time again.
- Certain exercises just become heavier for some people always almost mechanically beautiful to see how precise certain things if people have a very regulated life, you can really see certain things getting tired more often faster and then you can use those as markers for the deload or you can adjust volume the next meso so this doesn't happen again and you can push a few things that haven't gotten as tired at the end of the meso tiny bit more.
- So adjusting deloads to phases where you have to focus on other things in life is usually how sadly deloads will be programmed in real life for most people. >> If you look at the science, there's not much there to look at the deloads.
- I think there's just one study on hypertrophy training which found no difference in you know something like that but it was just one deload week.
- Experiment try to do the amount of volume that maybe you don't have to deload every four or five weeks forcefully.
- If you start feeling like life is catching up to you or you're just fatigued, drop some volume down for a couple of days maybe a week.
- I don't think it's it's going to make a huge huge difference over the long run. >> A lot of our athletes do deload between like four and six weeks.
- If you don't do anything for a week, you come back, it's going to feel weird at first, but even when you come back, it's not going to be a whole new process of learning.
- Hypertrophy, you know, if you don't train for 7 days, you may lose some undetectable muscle mass, you know. >> I think after 2 weeks things become detectable.
- When people get sick or so, I almost feel like if somebody's out for a week, they come back and after 3 days they're back.
- If somebody's out for 2 weeks, it takes them 1 and 1/2 week to get back, usually depending how bad it was.
- But after the 2-week mark, so when you start getting into 3 weeks of not training, getting back into training starts taking longer than the time that you were out for most people.
- So, somebody's out more than 3 weeks, you start having effects on a muscular level.
- And at that point, especially if you really don't move much, because if you stay active, if you still use the muscle in some way, very little is needed to keep quite a bit of it.
- But if you move like a normal person and do normal activities, not going to happen. >> I think it's um 2 weeks until you see detectable muscle loss, but that just means detectable muscle loss, which doesn't mean that there's zero muscle loss happening even at 1 week.
- But, I've noticed this super anecdotally, but honestly with hundreds of people over time very, very often.
- And I also feel like in strength sports, taking off for a longer period of time is very rare.
- And it's incredible how little you need to train at a certain point to still maintain a very decent level.
- And taking off for longer time, like yes, you need to get back into it, but if mentally it doesn't frustrate you and you don't mind taking those two or three steps back and you can live with them and just work through these phases by going to the gym and training as you're brushing your teeth, like you just go and do it, you're going to be back very, very quickly.
- Of course you have you have a room, you know, if this is what it takes to maintain, takes just a little bit to progress and we have like this much space to yeah. >> You do have a lot of space to accelerate the process, but over time the space also becomes smaller and smaller.
- You won't see people progress at the same rate after years and years of training and just adding a few kg's to a pull-up will take you quite a long time.
- For tapers also I find it's very, very individual what people like and it's hard to have people that have you've been following for long enough and have had enough competitions to see and understand what really works for them.
- They really feel super good at that point in time and very often after a time where they reduced volume, they don't manage to actually get as good results even though they should be less fatigued and should be able to produce more force and they need this continuum and you can like peak them into the competition, while the standard way of deloading really depending very often on how much load they're really moving like someone who lifts extremely heavy and is really smashed after the lifts for quite a while will need maybe a longer taper that's a tiny bit more chill and there's like a very very fine balance there way more than in a classical deload to strike between keeping the intensity somewhere that they don't lose affinity to these loads and being actually able to dissipate fatigue enough to actually get to the competition feeling fresh but still feeling the affinity to the loads and not being like oh this feels super heavy I'm not used to it anymore.
- I've seen both worlds use a very standard taper technique for most most of my clients the first time around besides if I really know they suck after deloads like every time after we've done a classical deload they have such a hard time into training again.
- There of course I will start changing around the deload also because clearly is not doing what it should be doing and those people I will peek into the competition while people that generally feel fresher more motivated and great after deloads will go with a very classical protocol where you have one day where you have like the openers of the competition so at 7 for just two sets very easy and then a few sets of back offs that are very easy just to keep the movement another session that's generally very very light and then before the competitions best two days before the competition an extremely easy day do like a three times two with 40% of their competition weight and like just really go for the motions for a few sets they go home after half an hour they're done And then they actually it's like very similar to the concept of having a power day in the middle of the week and then being able to bring a better performance.
- But yeah, that's very competition specific. >> This is so nuanced for skills like it's insane.
- I have unlocked full planches with two people by using tapers.
- You know, when somebody is very close, we usually do like I did in in the past a two-week taper back when I was still following a Renaissance periodization and you know, stuff like that.
- If you do usually planches, you're going to do more planches in this phase.
- So normally you do planches, now you're going to do a little less planches, maybe half of the planches, but you're going to do with the ankle weights just to prime yourself whatever.
- And then in the last third, you just keep that that same volume, so very low volume, but you also drop the intensity like crazy, like medium bands, just nothing, you know, questionable if it even does anything, you know.
- And then you should feel very good for the competition or just for peaking.
- Can you really say it's unlocked if it's you have to peak specifically for it?
- Of course, you can't say it's because of the taper.
- Funny thing about preparing for competitions for very strong athletes calisthenics competitions is, you know, this all makes perfect sense for maximal [clears throat] strength, you know, makes sense.
- Still, you will see the top athletes literally training the day before the competition.
- But, you know, who am I to say anything? >> It's very difficult because there's so little data on it.
- Like the the way you structure taper is exactly the same way you structure usually a taper for a weighted comp at the end of the day.
- I keep the middle day quite easy also and the last day super easy if it's like a one-week taper.
- Some people I even done two-week tapers, but it's people that I know that no matter how long they take a break for, they can still perform.
- Very very important factor here regarding exactly competitions like for example when I prepared Yure for a competition, like we had a super intense preparation phase.
- Very much what you see the elite people on Cali still like actually working with complete sets and combinations and doing them over and over again or over a few months and like extremely well tapered before like with very easy two days before the competitions he was doing advanced tuck planches and stuff like that like super easy.
- At the competition had a performance never seen before and then though he had a drop.
- Like he kept going because he felt so good, you know, and the ego took over after competitions I usually for a week I tell people, you know, take off, chill, like don't do hammered Matthieu Van Gelder like day after day after day.
- I think it took two months almost three to recover from that.
- So, exaggerated because you're like in this super peak state where if you aren't careful and go down again and slowly build up to it again, you mess yourself up.
- Everything was going well, and he decided without preparation to do a I think five-day bike packing trip from Genoa, where like Liguria, where he lives to Rome.
- If you do something completely out of your comfort zone, and you're already at a state where you've pushed your body for a long time towards the limit, make sure to give yourself some time to rest and really recover from it.
- You know, you think, I mean, it's lifts I've done before, like maybe just a tiny bit more maximal.
- I have a big respect for it, and I've made experiences to start off like again too early, maybe, and people after 2 weeks like being it doesn't feel good.
- It's losing weight.
- It's actually not the training itself.
- People are going to get this wrong, but factually, the amount of progress you can make from losing weight alone while keeping your level the same beats the out of for your weight the same eight doing any training method for the same period of time.
- At that time I could do like two front lever pull-ups.
- I couldn't get to two front lever pull-ups and doing my planches for literally month and a half or two.
- But also, I gained weight.
- I think that was the bigger reason actually because the hormones just go crazy cuz I'm a fat guy.
- And until that weight is lost, you're not really at your old level.
- And when I exaggerate, like, you know, I've done 80 km over 1,000 m uphill before, and I just go and I just do it and I paid a price.
- Like it's different if you know it.
- But if it hits you the first time, you're like, I mean, it's not that much.
- The interference effect, which was so much talked about in the years before, I feel like it's very true for stimuli that you're not used to.
- It's about managing the fatigue and knowing when can I push myself, when when can't I.
- But there's people doing crazy Like I've seen a dude two months ago doing 10 Iron Mans in 10 days.
- That makes zero sense. >> 10 different cities, 10 different Iron Mans, and I think he also beat the record.
- He did one national deadlift record, I think is in his weight and weight class and age class.
- And then did two back-to-back Iron Mans.
- It's actually a bit more iffy because if you lose weight, yes, the muscle up and the pull up will gain, but the dip and the squat often feel more shitty and your recovery is worse, and you need to strike a balance there, and I actually do not like cutting besides water cutting sometimes in the worst case scenario.
- The idea of going way above the weight category where they're training and then shortly before while I'm peaking someone cutting, I don't think that's a good idea.
- You're stressed enough by peaking yourself, and then peaking, cutting, and water cutting before the competition, people get to the competition, they're completely It doesn't make sense.
- Find a stable weight where you know you can perform a few months before, get used to that weight, let it be a good weight where you can perform, you can eat enough, and you feel well, and your dip and squat where you're going to get the most of the weight out anyway will really matter.


### This ONE Exercise Determines Longevity PLUS Deload Weeks & Rehab Questions
https://www.youtube.com/watch?v=T5tJMwkhZtE
## Puntos densos

- If you had to judge someone's long-term health from watching them do just one movement or exercise, what would it be and why? >> Ah, that's a great question.
- You know, when someone does a Turkish get-up, it just tells you so many things about that person in one movement.
- And coordination, basic level of strength with all your major movement patterns.
- I love it. [laughter] Um, yeah, I guess I would have to go with the Turkish get-up unless I can think about it but man, that that is a really one movement to determine long-term health. >> Mhm. >> You know, one thing is just doing something hard for 2 minutes and just seeing how fast their heart rate would recover after that.
- Something that takes like muscular strength to do like in their legs, like a a base amount of muscular strength um, that um, will get their heart rate pretty high, and just, you know, like seeing how fast they can recover is a big one. >> Wait, um, Turkish get up, that's where you're laying down with a kettlebell? >> Mhm. >> Wait, and you said it hits all the movement patterns? >> Yeah, it's crazy.
- And like if you really analyze it, I mean, not optimally, >> Sure. >> but it, you know, like even at the bottom, you need strong back muscles to drive your elbow into the ground, to get your torso off the ground, you need a strong core, um, to press the kettlebell up at first, you need, you know, strong pecs, and then to transition to overhead, you're going to need strong shoulder complex, and then you need strong glutes and hamstrings and obliques to stand up with it.
- I'm in a chaotic phase of life, new baby, new job, don't have a great schedule, or they're just two moves I could superset every day for 10 to 15 minutes to not completely lose my current fitness level, dot dot dot, not forever, but knowing I only make it to the gym for a total body workout maybe twice a week, and it's not consistent. >> That's a good one.
- I'm going to give them three. >> [laughter] >> You asked for two, but I'm going to give you three.
- And then I would say push-ups, which are great, um, but if, you know, you're really limited on like how much time you can do you going to have to add blend some things together which you know, optimally you're not going to want to do that if you have more time because things are developed best separately, right?
- People hate on burpees man, but a burpee into a squat jump is really hard to beat for just a quick total body exercise that's going to work you know, you're you're pushing muscles and your squatting muscles and your heart and conditioning all in one.
- So if you can learn the Turkish get-up and you can only I always tell people if they can only do one exercise the rest of their life as hard as that is, I'd have to pick pick the Turkish get-up.
- So you know, maybe on one day all you do is three rounds each side of five Turkish get-ups and challenge yourself with it.
- It it'll smoke smoke you way more than you think just doing three to five Turkish get-ups.
- Just do three rounds of five each side three to five three three rounds of three to five reps each side of Turkish get-up on one day.
- On the other day do a little circuit where you know, you're doing like 10 to 12 front swings followed by you know, 10 eight to 10 burpee squat jumps followed by chin-ups and if you're real strong where the weight vest for the chin-ups to failure rest and just repeat that three times.
- And I know this is sounding really CrossFit and I hate on CrossFit. >> Wait, I was totally about to call you out. >> Yeah, but I mean like CrossFit is like you know, there's elements of CrossFit that are great when you just don't have time to do to separate the elements of fitness.
- So and it's like it's super time efficient.
- So you don't have time to do an hour strength workout twice a week and then your hour of conditioning um but right now, man, day one Turkish get-ups.
- Day two, that little circuit that I described and then if you have a third day and you can do it with your kids, let's say.
- Um >> With your new baby. >> New baby or with your new baby.
- So, you know, maybe your baby has to be a couple months old or few months old first, but like when Levi was really young and I need to stay in shape, I was kind of in the same boat.
- And another thing I would uh I got one of those baby things you can hook to your bike and I would just ride my road bike around the neighborhood and he would just take a nap in the back.
- So on a third day of the week, if you could add that in, um just go for a long walk carrying your son or daughter or whatever the baby is and then or pull them behind a bike.
- Make me think. >> Uh well, this is a shorter one, but if you mentioned weighted vesting weighted vesting >> Weighted vest >> [laughter] >> sounds like something that's illegal in five states. >> Weighted vest Maddie asks, do you prefer a weighted vest or backpack for rocking? >> That's a good question.
- And I and I remember hearing something about this one time but it does make a lot of sense is when it there's weight on both sides it like the just it sits directly on that brachial plexus like straight down. >> Where's your brachial plexus? >> It's like a bundle of nerves that comes out of your spine.
- It get like runs like >> Okay. >> And so it whereas if something's on your back just the way it sits it ends up like kind of pulling back on your chest and wedging into your lower back a little bit so it's like the weight's more distributed.
- Um, so some people say it's it's better for you like your especially your cervical vertebrae and your brachial plexus things like that if it's a backpack rather than distributed front to back.
- How much do you prioritize recovery in your training?
- And it's like man if we would just back off a little bit on some of of intense training the hard training.
- Like you can and the more they look into it, the more they're finding how limited recovery is like as far as like, you know, let's say you just take a rest day as opposed to you do every little thing, compression pants and TheraGun and sauna and ice bath and sit on your [ __ ] $10,000 vibrating chair.
- So I'm not just talking about your training, but like a shitty diet, um but introducing a lot of [ __ ] stress in your life that doesn't need to be there if you can help it.
- Alcohol and drugs, like things that just make your body harder to recover in the first place.
- Second thing is like to find that diminishing point of diminishing returns in your workouts and really think hard before you pass that.
- So if you can get 80% of the benefit from doing 10 sets a week of per body part of weight training as opposed to 25 sets a week, is that extra 20% really [ __ ] worth it if it's just going to crush your recovery?
- It's not really.
- That's fine for maintenance, but when you're trying to get things better, it's best to just focus on one or two things at a time.
- Periodization really does work and it's and it's there because they understood the people that developed periodization just understood that the body has a limited ability to recover and it's best to just but it's best to just focus on one or two things at a time.
- And so, rather than asking like, what I do to maximize my recovery, first you should think, what can you do to maximize your training that doesn't require all that recovery to begin with?
- Like, having a sauna is good for my mitochondrial health, it's good for my inflammation, and that's not just recovery, that's just general health.
- It's like something >> max. >> Yeah, recovery on recovery maxing.
- When I do want to deload, do I reduce volume, reduce intensity, or reduce weight, or all three?" >> That's a good and in-depth question.
- Um Okay, I think it's important for people It depends on your personality.
- For some people, yeah, I do you think it's important that you schedule in a deload, otherwise you just will never take one.
- I always kind of count on life circumstances providing a natural deload, you know, like I'm I'm getting ready to take a trip with Levi, so like that's going to be my natural deload week, right?
- That's my deload week." But other people, it's just like if they don't plan one, they'll just never take one.
- It doesn't have to be a week, but a period of time where you are like getting your heart rate up, you're moving, you're taxing your muscles a little bit, but like on no day during that week do you feel like super tired and drained.
- Now, how often is the deeper question, and it really depends on how big the deficit is that you're building during your training.
- Um but, you know, the question is how deep are you digging it and for how long you've been digging it?
- Um so, you know, if you can like plan your training perfectly where like you're just barely digging that hole and like you're taking those breaks throughout the week and everything is perfect, like there's an argument to be made that you never need to deload.
- And how often and how good are we are perfectly balancing our training in relation to our life stress?
- So, you know, sometimes life gets stressful, you know, hard time at work, you're not sleeping, or something with your kid, and you're still training hard.
- And just for like mental health and reset and so you look forward to training again, I think it's important to take a deload.
- But it's impossible for me to give you like a prescription cuz I have no idea what your life is like, your training is like, things like that.
- And that being said, when you deload, I think it's good to keep the intensity high a couple days a week.
- Keep the intensity high and the frequency a couple days a week, the frequency high and the volume really low.
- Intensity can be a very light weight and you're trying to move that as fast as you can for a certain amount of reps.
- That's a huge part of it cuz you know, you're still trying to train your nervous system and things like that a little bit.
- So, like you know, that that week we might not squat heavy or jump as far as we can very much, but there's a day where we take like 60% of our one rep max, maybe add a band to it, and just try to move that as fast as we can for four reps, and we do that four or five sets.
- Not in relation to your one rep max, but it's high in relation to how fast you're trying to contract your muscles, right?
- So, general rule of thumb is your training, even though some of the intensity a couple days a week needs to be high, um you leave the training session feeling better than when you started, and that's the key element.
- Every day during a deload week, you should leave the training session feeling better than when you started.
- So, even if you do a couple max effort sprints during that this a day on a deload week, let's say.
- So, you're going to spend an hour out there just doing mobility drills and stretching and some A skips, so you feel really good, and you do a few accelerations, like 10 yards, some bounding, and then the way you do that is you take long breaks.
- The 60-yard sprints are very intense, but after those two 60s, somebody asks you how you feel, you're like, "No, I feel pretty good.
- We're just going to do two good ones, and we're going to go home." So, that's what I'm talking about a deload week.
- And then the other days, break an easy sweat, go for an easy bike ride, play a game, you know, like in in my programs during deload weeks, we'd often just like play like ultimate frisbee or something like like one day.
- Any advice on how I can encourage them to move more in a way to better their chances at aging healthy and staying active. >> Okay.
- Well, if they're in their 60s, they're Are they still baby boomers or baby boomers older now? >> I I don't even know what Gen X means or any of those terms. >> If we're going to be honest, I I got a picture in my mind of what it means, but Um, so if they're in their 60s, it means they kind of grew up, you know, in the 70s and 80s probably.
- And if they haven't grown up weightlifting, they have a notion of what weightlifting is and how it's dangerous and how it's for bodybuilders and it's not for them.
- And so, that stuff really you're just fighting an uphill battle cuz we we get our brain thoughts and our patterns are wired in at 60 and trying to convince somebody to do something that they just believe is not for them or they believe a certain thing is just you're swimming upstream there.
- It's like, "Hey, you don't need to lift weights, but if you do like every time you pass a park bench and you're going to have to get creative based on the route that they take, but do 10 push-ups on the park bench.
- You know how like the park bench the The is really high, so it's like an elevated push-up, so almost anybody can do that.
- And a lot of times they have those like little jungle gym things set up along the parkway or something like that, or maybe you can encourage them to walk there and and do like four or five bodyweight rows.
- So, find things in their environment that they can add to their the routine they're already doing to enhance that routine is very important.
- And then whatever you're going to encourage them to do, you have to fit it into the routine that they're already doing, and it can't be viewed in their mind as something that like bodybuilders do, or guys do.
- So, but man, I honestly, it's going to be an uphill battle because people are just set in their [ __ ] ways and I and I feel you there. >> Moving on. >> You get several questions about injured shoulders and I know that you have a personal shoulder issue.
- Somebody else says, how can I still press working around shoulder pain? >> Okay, so, I just a rule now and I'm just going to let people know, anybody watching this, I'm not going to answer these questions anymore for two reasons. >> Mhm. >> You don't give me enough details.
- And and two, and most importantly, I should have said this first, I'm not a physical therapist.
- So, as a coach and a trainer, I can give like do no harm things that ways to exercise where I'm pretty sure it's not going to make a shoulder worse, but I I'm not like a rehabilitation specialist.
- Um, you really need to pay money to go see a physical therapist and I'm just going to stay in my lane and I'm not going to give rehabilitation advice for orthopedic injuries.
- And I I first of all, even if I was a physical therapist, I'd be like, I have to evaluate you.
- So, I'm telling you go get an x-ray and an MRI so I can I can actually know what's going on and I need and from that, the doctor is going to write up exactly what they see on the MRI and I'm going to read it as a physical therapist and then I'm going to evaluate you to see where the pain is and where your level is at and then from then then I can give prescriptions on rehabilitation exercises.
- And I'm No offense, but I'm just not going to do it anymore. >> Okay.
- That's the rule. >> All right, I'm going to go with an unexpected one.
- My high school coach.
- So, if anybody's listening that knows this from my hometown or knows Tony Geschwender, he was one of the one of the two or three individuals that had the absolute largest impact on me in my life.
- And um so, I was in there and and at the time, even though it was a small high school, I just idolized these high school football players, right?
- And at the end of the lift-a-thon, the coach called all the young down and let them bench press.
- And um after I got done with the rep, he patted me on on the back and he said, "You're pretty strong." And like you know you have to understand like this guy was my idol.
- And for that guy to tell me I was pretty strong changed my life.
- So it just convinced me that like man, I'm pretty if coach thinks I'm strong then I'm strong.
- From then on out like I knew I was pretty strong and I knew I could get stronger and I dedicated myself to lifting weights and believe that I can do it.
- And every time somebody was stronger than me, it was in the back of my mind well, coach thinks I'm pretty strong and so that means I can get stronger.
- Like if one little word that you might not think of, coach probably get coach Tony didn't remember this, changed my life.
- And if you are careless with your words and say you know, you're you're not very smart or you're just not good at this, that kid will believe that.
- So be very careful with what you say to young kids.
- And and every all through my coaching career I remember that moment with coach and I was very careful what I said to my kids.
- And every time they had negative self-talk, my antennas were up.
- But that high school program was so advanced compared to what you would expect from a small town.
- And he just he got it from I didn't know at the time but looking back he got it from Husker Power, which is um Boyd Epley, legendary college strength coach, the first ever full-time strength coach in college football.
- And you know, Boyd Epley's program was just light-years ahead of its time compared to what else was going on in college football at that time.
- Um and he started Husker Power, he laid out a template, and you know, we started doing plyometrics, we started doing deload weeks, we started focusing on bar speed, we started blending bodybuilding, powerlifting, and Olympic lifting together in a smart periodized program.
- That's all we got. >> All right, guys.


### Upper Body Day After Deload Week On the HEAT Program
https://www.youtube.com/watch?v=cgn853aie4g
## Puntos densos

- [music] [music] >> What's up, guys?
- We're on the Fitness Culture Heat program. [music] You can check out a free week in any of our programs anytime you see me come into this, just click the link below.
- Make sure you check it out and get that because it's going to be something that you know, you're going to want to have access to that app.
- Today, we're doing the Heat program.
- We're on a new cycle.
- So, last week was a deload week, which still means we're you know, we're putting in work.
- Um but got the tattoo, [music] got the body fat checked last week.
- We're up in Boise, Idaho now.
- We're training at Empire Fitness.
- We're [music] going to jump into this workout.
- We're going to get just downright and dirty with it.
- We're going to have to dig deep and have a jolly old time.
- We're moving away from close grip.
- Today, we're getting to go a little bit more normal on the bench press.
- Really make sure that we're lats are engaged on this.
- Coming straight [music] down, straight up.
- 2 minutes. >> [music] >> It's actually hard for me to rest 2 minutes after kind of doing all the Hyrox training.
- Feel like I'm not doing anything.
- So, if you need to, if you're like me and actually speed up the workout, get on a clock, [music] have a partner go back and forth with. >> [music] >> I do love a pal raise.
- So, we're making almost like a T here. >> [clears throat] >> Stabilize yourself there.
- 3 seconds. [music] It's going pretty good.
- So, jumped up approximately [music] 15 lbs more than I should have.
- So, I'm going to get a spot.
- Last one.
- Oh, no. >> Working out with 45 lbs for [music] six.
- Really focusing on >> [music] >> today upper body strength movement plus some mobility exercise for the shoulders.
- Stay light on this one. >> [music] >> Big thing right now for me, I'm going to start really dialing in.
- I'm a little fearful that my protein intake is kind of like my body fat.
- I'm grossly overestimating how much protein I'm consuming.
- We'll be getting on like just eating the same meals every single day. >> [music] >> Grab some protein spot meals.
- I know there's no way I'm hitting 230 grams [music] protein.
- I'm working out, you know, every single day.
- I'm getting my sleep.
- Drinking my water." I'm like, "Well, how's your eating?" "It's good.
- Because what we think is healthy versus really what is, you know, crucially important is getting enough protein, minimizing total calories.
- When we combine all those things together, we're going to have a really hard time not hitting our goals >> [music] >> if we're following a meal prep or a meal program that we know.
- And that is the one thing I think we do extremely well in the Fitness Culture [music] app.
- It's not just a cookie-cutter one-size-fits-all.
- I know some people [music] that love fasting in the morning.
- Again, in the hierarchy of needs, calories, macronutrients, [music] and micronutrients.
- And, you know, and then making sure that we're drinking enough water um and supplementing correctly.
- And that's the hard part. >> [music] >> Say hello to my friend Arnold.
- No we centric [music] here.
- Plus, we're going to go straight into our supported T-bar row.
- Supported chest row, supported T-bar row.
- Uh, we're going to go a little bit more neutral on this grip here.
- I I love just absolutely always taking over with my biceps, which is not a good thing.
- It's just what I do.
- So, again, it's kind of like on my bench press, my elbows want to creep out.
- On this, my biceps want to take over.
- Shoulder blades down and back.
- But, I'd still rather do it over just a standing bend over.
- Instead of I'm going to throw a little curveball on this.
- I need less of a supinated supinated grip lat pull down. [music] I'm going to add in another low to high row for me, just a little bit more of a weak area [music] training.
- Uh, Poliquin raise or lateral raise like we're doing with this and dips for chest. >> [music] >> Okay.
- Big thing this for chest, we want to elevate the butt.
- Chest comes over over top of the ground.
- But and then we're really using that chest in a fly motion.
- Like I said, we got a little substitution going on out here.
- From here, I just feel like I'm throwing my arms out to the side.
- Traps will take over if we start raising our hands higher than our shoulders.
- So throwing it out to the side as wide as possible. >> [music] >> Controlling on the way down. >> [music] >> It's almost like the first part.
- So, we're we're supinating, pronate on the way down, keeping those elbows nice and tight.
- So, we'll come down, instead of pressing it back up as a skull crusher, down, roll it, and then close grip bench press it up. [music] So, go a little bit heavier than normal than you would for a normal skull crusher on that.
- We'll be headed to the gym together, a little couple's day.
- Upper body, we did chest, shoulders, back, biceps and triceps.
- But all in all, starting to feel a little bit stronger.
- Starting to feel my central nervous system kind of feel like fire back up on those bench presses, being able to explode a little bit quicker.
- I mean, partly because I was there before and just hadn't been training my central nervous system for explosive lifting while I was doing the Hyrox training.
- So, it's good to be back in the gym.


## fitness app data model exercises sets reps

### Cómo crear una app de fitness con IA (proyecto real, no demo)
https://www.youtube.com/watch?v=n8vprs80578
## Puntos densos

- La idea del día de hoy es mostrarle el alcance de la herramienta, poder mostrarles lo que logro y un problema en particular que me está acusando hoy, cómo lo podemos solucionar con inteligencia artificial y si esta herramienta puede ser válida o no.
- En este contexto quiere decir que lo que vamos a hacer hoy puede ser demasiado avanzado, pero el objetivo del curso es que puedan llegar a hacer estas cosas.
- Entonces, vamos a darles el contexto del problema.
- Lo que quiero lograr con la aplicación de hoy es poder gestionar mi progreso de manera personalizada, eh, basado en la ciencia y eh que me permita realmente hacer un seguimiento para poder evolucionar en mis ejercicios día a día.
- Lo primero que voy a hacer es entrar a Cloud Code, a Cloud, perdón, y le voy a pedir que investigue a fondo las app de ejercicios existentes en el mercado.
- Eh, cuando le digo que investigue fondo, él debe investigar todo, pero de todos modos le voy a decir cuál es la intención de la investigación.
- Por esto es importante que con que veas todas las funciones funciones de cada una y cuál es mejor y por qué y eh y por qué. de cuál es mejor y por qué.
- Entonces, aquí lo que le estoy diciendo es eh que voy a tener unos usuarios y ya no va a ser personalizada solamente para mí, pero eh en contexto eso eh importante, debes solicitar login coma un perfil del usuario. un perfil del usuario, eh, y un perfil del usuario y todo lo demás en el diseño.
- Eh, ¿por qué lo por qué le estoy pidiendo login? porque quiero que sea una app segura.
- Y eh ahora él va a pedir aquí en este momento nos va a pedir eh vamos a ponerle el más avanzado.
- Y con base en esta investigación es que vamos a desarrollar nuestra aplicación web que nos permita eh gestionar nuestro progreso en el gimnasio.
- Entonces, esperemos que nos haga la investigación mientras Ah, bueno, mira, aquí nos empieza a preguntar un par de cosas. ¿Cuál es el foco principal?
- Entonces, y bueno, volvemos con la grabación que teníamos desde la mañana, donde pusimos a nuestro amigo Cloud a trabajar en una app de seguimiento del progreso en el gimnasio. ¿Listo?
- Entonces, vamos a ver qué ha pasado con Cloud y que ha ido avanzando.
- Estábamos eh hicimos una investigación, una investigación de mercado, eh perdón, una investigación de las apps que están en el top 10 del mercado y de eso cogimos las características y le pedimos que nos detallara cómo debería ser una aplicación.
- Hay un plugin plugin plugin que se llama UI UX Pro Max.
- Este plugin que está aquí eh actúa como un agente eh que se encarga de revisar todo el proceso de la creación de una página web o una aplicación móvil desde el diseño, eh desde el diseño, el código, todo todo lo que tiene que ver con eso.
- A ver, si no llamas el plugin o no tienes una etiqueta puntual de qué es lo que tú quieres, él va a crearte una aplicación web solamente diciéndole eso.
- E crea una app con las siguientes instrucciones y le das todo el diseño que te creó Cloud con eh con la investigación pasada.
- Entonces, ¿qué hace? revisa bien el código, revisa el diseño, revisa eh congruencias, revisa un montón de cosas que de pronto cuando se lo pide sin llamarlo no va a tener en cuenta.
- Entonces solamente le di la como prom crea la aplicación con las siguientes instrucciones y le copié todo lo demás y él empezó a trabajar, me hizo una pregunta eh como estaba trabajando en una aplicación parecida, que si quería esa o empezábamos una nueva y que si además quería la aplicación completa o quería adelantos paso a paso.
- Miren todo lo que empieza a hacer.
- El mismo empieza a hablar y auditarse él mismo en cada una de las cosas que está haciendo, porque eh el plugin que tiene hace evaluar cada actividad que haga.
- Eh, les digo algo importante, acaba de salir un anuncio de Antropic, que esta parte de aceptar de la forma humana los las peticiones de lo que va a hacer cloud va a ser eh puesta por default en que continúe y solamente para usuarios que necesitan revisar lo que están haciendo, tendrán la opción de de tenerla habilitada.
- Y eso debido a que e en el estudio que se hizo cuando se puso ese chulito de seguir o no seguir con Cloud Code, se dieron cuenta que tenía muchos más errores cuando nosotros los humanos aceptábamos o no aceptábamos esa eh esa responsabilidad o esa eh o esa tarea que tenía que ser Cloud.
- Eh trabajó y trabajó y trabajó y trabajó y luego me dijo por acá que esto era lo que debía hacer.
- Vamos a hacerlo aquí con ustedes.
- A ver, CMD y les va a salir símbolo del sistema.
- Le dan clica, eh, voy a volverlo a hacer aquí con ustedes sin bajar el servidor.
- Entro a la carpeta donde está la aplicación que me está montando.
- Si no estoy dentro de la carpeta, no me va a eh no va a ejecutar esa aplicación, sino cualquier otra o va a lanzar algún error.
- Y aquí en dentro de la carpeta lo único que tengo que hacer es escribir este comando.
- Con este comando se va a abrir, mírenlo aquí, tal cual va a escribir esto que está acá, que es eh la aplicación como tal y el e la ruta local donde lo puedo ver desde el navegador.
- A ver, aquí dice que si le doy control y click, control y click me lo abre.
- Perfecto, aquí estamos dentro de la aplicación que nos está creando dentro del local host como tal.
- Vamos a ver qué pasa si le damos acceso con Google. tratamiento, datos de salud, comunicaciones comerciales, si lo quiero, analítica de uso, métricas para mejorar opcional siempre vamos a ponerle que sí a todo.
- No me dio acceso con Google, entonces vamos a ver, vamos a poner el nombre, vamos a ver qué me pide.
- A ver en qué etapa estoy.
- Porque esto salió desde el punto, desde la necesidad de saber cuánto estaba cargando de peso y de ver por qué no estaba avanzando en cierta parte. en ese tipo de orden, ya esas serían mis tres prioridades y yo estoy en nivel avanzado porque llevo más de 2 años trabajando en gimnasio.
- Pero no quiero hacer cardio. ¿Qué dicen ustedes?
- Vamos a ver cómo crea mi plan.
- Vamos a ver cómo es empezar con mi primer No, quiero ver el plan completo.
- Vamos a ver qué creo esta vaina.
- Veamos a ver.
- Entonces, el peso sería 100. por Bueno, ya aquí tenemos el primer detalle que no sé cuál es cuál.
- Eh, de eso voy a tratar ir probando, ir revisando las cuestiones, pero miren que aquí no tengo la etiqueta de si aquí es el peso o es la repetición, aunque al final para la cuenta es lo mismo, pero me gustaría saber que tenga las etiquetas puntuales de cuál es el peso y cuál es la repetición.
- A ver, todo esto está perfecto.
- Wow, muy bien, muy bien.
- El entreno de hoy ya me dijo que era y me dijo, "A ver, esto sí me está gustando.
- Bueno, entonces veamos a ver la biblioteca de ejercicios.
- La biblioteca, aquí están la biblioteca de ejercicios.
- Este es mi plan de ejercicios de la semana.
- Y en entreno libre puedo añadir ejercicios.
- Inicialmente esta app está bastante completa y digo inicialmente porque eh vuelvo y digo, el objetivo era poder crear una app que me permita gestionar mis eh ejercicios.
- Yo solamente le pondría dos cosas a esta aplicación para que funcionara perfecta.
- Una es que me me permite personalizar mi rutina de ejercicios, eh, porque me la creó por default.
- Yo nunca le dije que me lo hiciera así, sin embargo, me parece genial que me haya hecho toda la rutina completa de la semana, si no tengo que pensar en eso.
- Eh, y lo otro que le pondría es realmente nada, ya nada, ya, solamente eso, con que le pueda poner los ejercicios personalizados.
- Veamos a ver para ver este siguiente a ver si lo puedo personalizar.
- Aquí está la rutina completa.
- Me la app está totalmente completa.
- Me falta solamente solamente el tema de la eh del login.
- Vamos a ver qué me dicen acerca del login.
- Eso está bien.
- El registro del servir Walker no puede probarse porque el naveor bloquea la descarga del script, el código y el manifiesto.
- El registro del service Walker recoge lo pendiente antes de lanzar el back en ISO real.
- Pero entonces a mí no me interesa realmente que esté con Google porque lo que quiero es montarlo dentro de mi eh dentro de mi servidor, dentro de mi página web.
- Eh, de aquí en adelante la intención es que vayamos avanzando cada vez más despacio, de cero a más.
- Eh, en ese sentido si vamos a empezar a explicar cómo se pronuntea, eh, cómo se hace un agente, cómo se conecta un plugin, cómo eh nos conectamos a otras aplicaciones y cómo podemos crear una aplicación ya robusta como esta que estamos viendo, que eh realmente está bastante interesante.
- Vuelvo y digo, esta es una aplicación gratis, eh, que si la vemos en el teléfono debería verse muy bien, muy parecida a las aplicaciones comerciales que están aquí.
- Ventajas o desventajas, pues ya habría que probar la aplicación a detalle, eh, y ver en qué cambia.
- Me gusta, de verdad, que me hizo la semana, que me hizo el plan completo de la semana.
- Eh, si no tengo la experiencia, pues es muy chévere porque esto me lo me lo me lo facilita. y sí me permite crear mis ejercicios.
- Recuerden seguirme, seguir el canal y veamos a ver cómo vamos continuando a crear nuevas aplicaciones y nuevos sistemas para ustedes.


### Fit4i vs. Traditional Fitness Apps: Which Is Better?
https://www.youtube.com/watch?v=l7-hFYG31l0
## Puntos densos

- [music] Oh yeah.
- Oh [music and singing] yeah.
- Let's [music] pour it out.
- I know what you're [singing] thinking.
- This life that we're living ain't never [music] going to give it up.
- There [music and singing] you go.
- We stay all [music] day, all night.
- The time of your life. [music] This is the time of your life.
- Remember, you don't get it twice. [music] The time of your life.


## personalized workout plan generator app

### How AI Builds Personalized Home Workout Plans That Actually Adapt
https://www.youtube.com/watch?v=q6LdP19OaVs
## Puntos densos

- Instead of static routines, AI systems analyze your performance data, recovery patterns, and available equipment to build a plan that evolves with you.
- These platforms use machine learning algorithms to adjust exercise selection, sets, reps, and rest periods based on your feedback and progress.
- Whether you're a beginner or experienced, AI helps ensure every session counts toward your goals without needing a gym or expert guidance.


### How AI Creates Personalized Workout Plans That Adapt to You
https://www.youtube.com/watch?v=PTCSQlQNEUk
## Puntos densos

- Instead of generic routines, AI models analyze user data like fitness level, goals, available equipment, and recovery patterns to create customized exercise sequences.
- For example, if a user struggles with a particular exercise or reports soreness, the algorithm modifies future sessions to reduce strain or target different muscle groups.


### The BEST Fitness App Just Got Even Better? \\ Jefit AI Adaptive Plan
https://www.youtube.com/watch?v=9-l8V435qk8
## Puntos densos

- They don't tell you what weight to use next week or what weight to use.
- So, finally, we have an app that actually adjusts your weight and reps based on your performance.
- So, when you set up the adaptive training plan, just like any other fitness app, it's going to ask you a ton of questions to create a proper personalized goal for you.
- And it's going to ask you what your fitness level is and how many days you want to train, the length of each session, what type of gym and equipment you have, and of course, muscles you want to target specifically, along with any injuries you might have had in the past.
- Now, once you enter all that information, it creates a workout plan for you automatically.
- Now, before we get into the workout themselves, the top part of the section shows you a progress bar for your adaptive plan.
- Now, what I love about this is that how it closely mimics proper training cycles.
- Now, this is where the adaptive plan gets very interesting.
- Now, for me, this is what my program looks like, and this is pretty good considering the fact that I only go to gym about four times a week.
- Now, we are going to go through every single exercise in my entire program that G-Fit has built for me, but what I do want to show you is what the first couple of phases and cycles look like for me personally.
- Now, on this day specifically, G-Fit advises me to do 275 lb for about four to six reps, which is perfect and light enough for me, especially when we think about building momentum for the entire week and program.
- And honestly, when I saw how closely this matched to what an actual coach would program for me, I was super surprised and really pleased to see an app actually execute.
- Now, you might be thinking, what if the weights and reps were too easy that did more than what was recommended?
- If that is the case, the app and adaptive plan would automatically and intelligently adjust your plan in the future based on your previous lifting, which is a super awesome and amazing feature for anybody that goes to the gym regularly.
- If you're already using JFit or maybe you plan on signing up, your adaptive plan is going to look completely different than mine.
- But, when you do start using the adaptive plan, you'll notice that from your side that your workouts will get released weekly.
- But, now with this new adaptive plan feature, I feel like the value for this app have just jumped a ton.
- So, not only give me a proper lifting plan, but also insightful data to learn a thing or two about lifting and help me actually perform at my very best and improve.
- Now, the app is actually free to use minus a ton of other features, especially the adaptive plan, but you can also use the JFit free trial version as well to test out if it's actually for you or not.
- And of course, I've also done a full review of the JFit app, so make sure you check that out if you haven't already to know everything that's in the JFit app.
- And make sure you check out some of my other videos.
- So, make sure you check those out.


### This FREE  Website Creates Custom Workout Plans in Seconds!
https://www.youtube.com/watch?v=u67yfYajyKo
## Puntos densos

- Today we're going to be looking at a website [music] called workout.cool, a free AI-powered fitness website that helps you to generate customized workout plan [music] in just a few clicks.
- Workout.cool is an online fitness platform that uses artificial intelligence [music] to generate workout routine based on your personal goals.
- Whether you want to lose weight, build muscle, improve your endurance, or simply stay active, the [music] website creates a workout plan tailored just for your needs.
- Within seconds, the AI generates a structured workout plan designed specifically [music] for you.
- The workouts are organized clearly, making them easy to follow even if you are new to fitness. [music] Because everything is generated based on your preferences, you can experiment with different workout [music] style and adjust your plan whenever your goals change.
- Workout.cool [music] is ideal for beginners starting their fitness journey, professionals who need quick access to [music] workout plan, students looking for free fitness resources, workout enthusiasts, gym goers wanting free fresh workout [music] routines.
- If you're looking for a fast, free, and easy way to build a personalized workout routine, workout.com [music] is definitely worth checking out.


### TPG — The Plan Generator | Smart Gym Kiosk, App & T_Block Wearable
https://www.youtube.com/watch?v=UneOaLfYfWg
## Puntos densos

- Are you scared of injuries in a gym?
- You just stand there wondering how to do it, what to do it, and how much to do it.
- Sometimes you are just lost in a gym.
- Some of them know exactly what to do, how to do, and how much to do.
- The plan is just ready for him.
- And yes, same plan, same ecosystem, already in his pocket.
- Easy to use, easy to install.
- It follows the member, not the gym floor.


## progressive overload tracking app

### Body Stats Tracker App | Track Your Complete Fitness Progress
https://www.youtube.com/watch?v=72bkGX9hd0s
## Puntos densos

- And if you're looking for a body stats tracker app, you found the right video as Pumpal combines workout tracking with tracking your body stats.
- We have progress photos, which allows you to track your um, front, side, and back shots and compared them from your previous photos.
- So, you can visually see your changes over time.
- We offer body measurements um which allows you to quickly record your body measurements and then track those over time and compare them to your first measurements.
- There's all kinds of cool little features we have in Pump Pal that are free to use and allows you to track your body stats.
- Um tracking your body stats.
- It's a way to keep track much like progress photos um of your progress over time without the scale being involved.
- Although we do take the scales measurements in measurements, um there's many more things we keep track of besides just the overall weight.
- Once again, if you ever have an issue where you went a couple weeks, maybe you're trying to gain weight and you're maybe you're stuck at like 200 lb, didn't gain any weight for a couple weeks, or maybe you want to go down, you've been stuck at 200 lb for a couple weeks.
- Um, and maybe even in progress photos, you might not have seen your progress, right?
- Um, when you should take the measurements, all kinds of good stuff is inside there if you want to take a look at that if you want the best possible measurements.
- Um, so find your thickest point in all these diagrams.
- It not might not necessarily be your thickest point.
- So just find your thickest point and that's where you want to measure.
- So essentially um whenever you take your first measurement um the app will remember your first measurement.
- Inside here, you can then take in your weight, you can take in your body fat percentages, um you can take in your waist, your hips, your chest, your neck, your left bicep, your right bicep, um all the different measurements that uh you can take, right?
- And then you want to just hit save and it'll add it to your list.
- And then you can also compare those measurements to your first measurement.
- On the top right you just hit that compare button and you'll have your measurements.
- Um this one has a change in your weight.
- Um, I think I'm going to add into your account section what your goals are at this point.
- Um, but let's say like um if you're trying to lose weight, you've been stuck at 225 um for a couple weeks and then you looked at your progress photos, you didn't really see much change, but then you come in um in here and you maybe you had, you know, tenth of an inch come off your waist or a quarter inch come off your waist or maybe your arms got bigger, so your weight didn't change because you actually put some muscle on your arms or, you know, maybe your body fat percentage changed even though that uh the scale didn't change, right?
- This is where you actually make the plans for your workouts and you actually go into your workouts and adding exercises to your plans and things like that.
- Um, so you're planning out your whole week of what you're going to do for your exercises and then, um, you would repeat that week after week after week, right?
- Um, if you wanted to make a plan, um, and you know kind of what you're doing and you want to make a plan, you can add a custom plan by hitting the plus button in the top right.
- Um, and it'll ask you to set up the plan's name and what day of the week you're going to do the plan, like so.
- Choose which day of week you want it, and then you hit add plan. and it'll add it to your list.
- Um, if you're someone that doesn't know quite right, you know, at the moment of how to set these exercises up, um, you can use your free plan builder on the bottom there, that, uh, build a new plan button.
- And then you hit use this plan and it will add that to the list of plans.
- But yeah, um so if you want to go ahead, let's say we created a plan and we wanted to add exercises to the plan, all you would do is you just hit select, you know, whatever plan it is for that week and you would then go into a screen where you can add exercises.
- So, this is a current list of exercises within your plan.
- Um, if you wanted to add another exercise to it, um, you can add exercises to the custom plans that are built the plan builder.
- Um, so this one, we can hit add exercise and then it'll show you a screen like so.
- And you can add an exercise.
- Alternate is let's say you're setting up your exercises.
- Um, the main reason that I would have an alternate exercise is that if I'm at the gym and let's say I'm doing squats and all the squat racks are being used up, um, I don't want to wait around 15 minutes for the squats to be um to free up, right?
- So definitely check that one out there. um add that in and then you simply hit add, you know, add your sets and how many sets you want.
- Like most people do three, but you can add as many sets as you'd like for the exercise.
- Um just so you know, by default, it's going to give you on the alternate exercises, if you put in three sets for the body weight squat, it will then automatically add three sets in for your alternate exercise, too.
- Um and then when you go to swap it for the first time, it'll just have zero for the weight, and then you just add whatever weight you're doing for the alternate.
- But yeah, and then just below there, you don't really see it in the image, is where you have a save exercise or edit exercise, depending on what you're doing.
- And then that's where you'll get added to your exercise list like so.
- So, if you wanted to get into the exercise, right, you just hit start workout and then you'll be brought into that exercise, right?
- Or that um to begin your exercise.
- And then here is what it looks like within the exercise.
- Um, you have your, you know, what exercise you have to do first.
- It'll play a sound and then you can go into your next set, right?
- Maybe one day you want to do lighter weights, but it's your way of alternating between whatever you chose to have as your alternate exercise for that.
- So, maybe it's push-ups next or whatever it is that's in your list.
- And then eventually you'll get done with your exercise and they'll give you a workout summary and give you all kinds of information about your workout.
- So, your plans are your your days pretty much your days of the week.
- Inside your plan, you have exercises and then you can add more exercise, add those exercises.
- Those exercise have an alternate exercise and you start your workouts from the plans.
- We have the plans list and then we have the groups list.
- Um the groups are a way to keep um your your list organized.
- If you select that, that'll actually allow you to group whatever's in your plans list and put it into a group for later use.
- You'll be prompted to ask you, I remember when I was building this, I was like, do I want to assume they want them out of the list?
- You can go ahead and decide if you want to keep the plans you currently have in your plans in the plans list.
- So maybe you just want to group them but you're still going to do the exercises, right?
- Um you can just say keep them in your list and then you can then add a group for those items.
- Um you remove your plan or you can remove the plans from the list.
- You can then remove them from the list and group them as you might want to use that group of exercises later on.
- Um, and then once you do that, you're going to be into the group screen where you have your groups, right?
- Um, and then if you want to make a custom group without any plans, you can hit that plus button.
- Um, you can delete the plans in your plans list or you can regroup those up and remove them from the list.
- However you want to do it, you can do then you just add this group to your plans list.
- So, I remembered your plans and that you put in that group and then you just hit the the button add group plans to plans list and then it will send those over to your plans list where you can begin using your plans again here.
- You want to grow your legs.
- Maybe you wanted to grow your legs, maybe you wanted your legs stronger, maybe you want your chest stronger.
- Your reasons are the reasons why you should be continuing to work out, sticking to your diet, um these are here to help you stay motivated.
- A lot of times when you first start working out, um you have huge motivation, you're all excited about it, and you know, a few days start to go by, a week goes by, and that motivation begins to fade, right?
- Because this is something that takes time, years if not um for the rest of your life is the current I mean should be your goal.
- So whenever that motivation fades, you make a list of reasons why you should keep going.
- And you can always come back to these, excuse me, and read these and keep your motivation up.
- Maybe you maybe you just got broke broke up with your girlfriend.
- Now you're trying to look for a new girlfriend.
- There's a million reasons why someone might um want to continue working out and continue a healthy lifestyle.
- I had reasons almost every day as I think of them and I review them um whenever I'm feeling not motivated to go to the gym, read them over, get my motivation back and then go to the gym.
- Or even if you're going to cheat on your diet and you know you got you can be cheating on your diet, read your reasons and it helps you get reotivated to keep going.
- If you're not sure on which reasons you should use, we do have a presets option here and you simply go through the presets.
- You know, you can build strength, lose weight, improve mental health, increase energy, um doctor's recommendations, be a role model for your family, um perform better in sports, and gain more confidence, right?
- You can put in the reason why you're doing it because you want to beat your beat your brother at the weight loss game.
- Um, you want to put your reasons here so you always have a place to come back to reread your reasons.
- Um you're grandfathered into all feature features.
- So for $39.99, every time I add a new feature, you can rest assured you're going to be able to use that feature.
- Um, you can also sync across your devices.
- So if you have a phone or a tablet and you sign into both of them, all your data will sync together seamlessly.
- Um, also if you ever get a new phone, a lot of people don't think about that is then once you get your new phone, you can simply sign in your account and all your data from your uh previous phone will just be synced to your new phone.
- Definitely give that a chance and check it out. um it'll help support and help me grow this app and get you more features.
- The feedback option lets you come out and communicate with me um directly and maybe you have like a problem in the app I'm not aware is a problem.
- So, if it's a problem, be sure to select that one so I'm aware of it and try to get it fixed as soon as possible.
- Um, even if you go into the app and you don't use the app, um, end up using the app, um, give me some feedback.
- I want to make an app people want to use and stick around with for years.
- So, definitely show shoot that out to me whether you use the app or not.
- You got your plan builder, you got your plan, you have your body measurements, you have your uh progress photos, you got your reasons, all kinds of features inside uh pump out to track your body stats.
- Um be sure if you have an idea for the app to reach out to me in that feedback section.
- Be sure for sure if you're having issues um in the app um to reach out to me in that feedback section again too as there may be a problem um that I'm not aware of and I can get it fixed for you.
- You know, when you're listening to music and you're tracking your workouts, when the rest timer went off, it stopped your music and then you had to replay your music every time, which would be annoying.
- You can give me the feedback on the app side and you can also go to my website pumppoworkoutscul.com.
- Um, submit feedback there too so I can get notified and figure out what's going on.
- Otherwise, I think I kind of covered everything I want to cover.
- Um, be sure to like and subscribe to this channel if you like this kind of content or want to keep up with Pump Pal and its new features as they come out.
- Um, otherwise I covered everything and you all have a good day.


### Ditch the Gym Notebook: Best Apps for Progressive Overload | IZEM AI Fitness Coach
https://www.youtube.com/watch?v=JSdAB3O6jxk
## Puntos densos

- Today, we're ditching those messy gym notebooks for automated progressive overload.
- Relying on memory means you end up repeating the exact same weights, which completely kills your progress.
- They gently recalibrate your progression based on your actual life.
- It actually does real-time voice calls with you, reviews your day, and remembers your specific context.
- Scan the room, and it instantly rewrites your progressive overload path.
- So, if you're ready to build absolute consistency, here is your exact checklist to get started today.
- Next, take your first AI gym coach call and scan whatever gym equipment you actually have access to.
- Finally, do the workout, complete your daily review, and let the algorithm handle next week's math.
- Try AI gym at your AI coach.life and knock out that first setup step today.


### Progressive Overload at Home for Women 35+ | The Complete No-Gym Strength System
https://www.youtube.com/watch?v=QtUNV6oI2J4
## Puntos densos

- What if your heaviest weight is just 5 kilos?
- And then at the end, the honest answer to when you actually do have to go up in weights and how you'll know when that time comes. [music] But first, let's just talk about what progressive overload actually is.
- It just means that you are steadily and consistently getting stronger and more proficient in your lifts over time.
- Now, most people think that just means adding more and more weights every session, but they're wrong.
- And when I say failure, I mean reaching that point where you physically cannot do another single rep without losing your range of motion or correct form.
- Now, in this 2022 randomized trial, there was a group who progressed by adding more weight and then another group who progressed by adding more reps with the same weight.
- They both had the same muscle growth after eight weeks because your muscles count effort, not kilos.
- And before anyone asks, because I also get this one every week, too, is, "But I won't end up looking like a big muscle person, will I?" >> Oh my god. >> No.
- Because throwing weight around that compromises your form and technique is not progressive overload.
- You might think you're getting stronger because technically you're lifting heavier, but you're not.
- So the first rule of progressive overload is to master your form and your technique first.
- Actually let me add a rule zero because some of you are worrying about dumbbells and form and progressive overload before you've even cracked the thing that comes before all of it.
- But progressive overload is built on comparing your last session [music] to the next session.
- It only works if you train and track consistently, not one week or guns blazing and then crickets for the next four. because two or three unspectacular workouts beats everything every single time.
- Let's say you're going to do a bicep curl and your rep range is between 8 to 12 reps.
- If you're going to do three sets of that exercise, let's say last week you could do 8 87. [music] Well, next week you're going to try for 8 88.
- Just keep progressing like that every session until you hit the top of your rep range, which would be 12 12 with good form and full range of motion.
- Of course, if you can hit the top of your rep range for two sessions in a row, that's called two for two, then that's your green light.
- Then you pick up the next dumbbell and you drop down to your 888 rep range again.
- Now, obviously, there's a catch if you train from home because you're going to be limited in the amount of dumbbells you have.
- So if that's what you're dealing with at home, here are the five techniques to help you progress and get stronger, even if you only have one set of dumbbells.
- If you're enjoying this content, make sure that you subscribe because I post strength training videos for women 35 plus every single week.
- Number one, the obvious one is just add more reps.
- I want you to see that as a guideline because if 15 reps don't challenge you anymore, just do more.
- And before you come at me with that whole, "Yeah, but you can't build muscle with light weights and high reps." >> Wrong. because the study I showed you earlier proves that you can build muscle with any rep range as long as you train to failure.
- Now I know you can't just exponentially do more and more sets.
- You can do more reps and also more sets.
- So, you're just doing more work overall.
- And that is your biggest lever if you're working out from home with limited equipment.
- Number three is tempo, which is my personal favorite because you don't actually have to change the weight, the reps, or the [music] sets.
- What this means is slowing every rep down to at least the count of three or four.
- So, if you can do say a bicep curl for 15 reps at a normal pace, try slowing it right down to the count of three or four with control and good form and see how many you can actually do.
- Then you just build your reps back up at that slower pace.
- Number four is pause reps and pulse reps.
- So, for example, at the bottom of a squat where your thighs are parallel and you've got the full stretch on the glutes, you hold here for 1 to two seconds and then push your way back up.
- So, if you can comfortably do 15 reps at a normal pace, try doing pause reps and see how much faster you fatigue.
- And then with pulse reps, you're going to do full reps as normal.
- And then when you start to reach fatigue, try and squeeze out as many more as you can do.
- It's the same amount of work but done in less time, which is way more challenging.
- So, you could do a squat [music] press to a curtsy lunge, which again is far more taxing than just doing a squat and then a press and then a curtsy lunge.
- And that's the whole point of those five techniques because you can continuously progress over a 6 to 8 week program without having to buy another single dumbbell.
- And then when you do another program after you finish that one, you're not starting from scratch necessarily, but your body will adapt to new stimulus and you can try all those techniques all over again.
- When you're ready, when you've exhausted all of those five techniques, you are at the top of your rep range and you're still nowhere near failure, that weight has now become your warm-up.
- You meet it at the bottom of your rep range.
- That's the whole point of the system because it gradually walks you all the way up to it.
- So, you can either do this in a notebook, the old school way with pen and paper, or you can use the notes in your phone, which was what I used to do before I had my app.
- Basically, you need to know what you did last session to be able to beat it by one on your next session.
- It's an app that Adam and I built and specifically for this reason to just track your reps and your sets and you can build your own workouts and it's super easy to use.
- And you actually shouldn't be aiming for that either, especially as a woman and especially if you are in your 30s or beyond. your energy, your stress, your sleep, and your mental load on any given day is going to massively affect your performance and also your cycle, by the way, if you still have one.
- And no, that doesn't mean you need to plan your workouts around your cycle.
- So don't neglect your yoga, your stretching, your myofacial release, your posture work.
- You don't need to over complicate it, and you don't need to be perfect.
- And if you want all of this done for you, home workouts where the progression is already built in, where you literally just press play and follow along with me, download the Strong Curves app.
- Don't forget to like and subscribe, and I'll catch you very soon in another video. [music] Bye.


### Workout Tracker App | Monitor Workouts, Progress, and Fitness Goals with AppSheet
https://www.youtube.com/watch?v=2D2ZsCDYMhM
## Puntos densos

- Track workouts, monitor progress in real time, and achieve your fitness goals with ease.
- Visualize your fitness journey at a glance.
- Here you can view your weight history and see your progress trend over time.
- Just select the date, enter your weight, and watch your progress graph update instantly.
- You can streamline your training all within one powerful app sheet platform.
- If you want us to customize it for your business, we'll build it for you, tailor it to your brand, provide ongoing support for your app, integrate it with your workflow, and ensure it complies with the standards you need.
- With Steagall's workout log, you can record workouts, track fitness progress, monitor performance in real time, and stay motivated, all in one powerful dashboard.


## workout generator based on available equipment

### How AI Creates Custom Home Workout Plans Without Equipment
https://www.youtube.com/watch?v=Z-Qp1b7ozPM
## Puntos densos

- What if your home workout could adapt to your body in real time without a personal trainer in the room?
- By analyzing inputs like your age, fitness level, injuries, and available equipment, or lack thereof, these systems generate tailor routines that evolve as you improve.
- Some apps even use computer vision to track your form through a phone camera, offering corrections without human intervention.


## workout logging app UX design

### Figma Paper Effect Log in (Sign in) | Sign up (Create Account) Page UI/UX Design No.3
https://www.youtube.com/watch?v=loHm5EyAFvk
## Puntos densos

- I want to reuse the one I created when I was creating this project, but I'm going to show you how to create it.
- I'm just going to draw a rectangle.
- And I'm just going to have this here.
- Next, I'm going to double click on the rectangle, hold shift, and just move this part back.
- And for me, I kind of push one back, push one front, just kind of randomly push it in different directions.
- So, I'm going to move this one.
- I'm going to maybe move this one front a bit.
- Move this one.
- Move this one back.
- Maybe push this one in a lot.
- Let me just like push this one out, this one in, and this one maybe just let's see around like this.
- So, I'm going to click on escape and escape.
- So, even though I just created one, you can see that it's actually different.
- And I'm just going to select it.
- So, you can go ahead and create it just like I demonstrated, but I want to use this one because that's the one I used when I was creating it.
- So, I'm just going to select this and delete this.
- I'm just deleting it because I want to use this one we have here.
- So, I'm just going to insert a frame like this.
- I'm going to grab this rectangle and bring it into this frame and align the center to the um rectangle and then move this rectangle back till you can't see the um let me just show you what I have as spacing.
- So you just want to push it out a bit so you can't see any of the parts of our stroke on the top, left, and bottom.
- Let's select selected on this rectangle.
- I'm going to select for the fill.
- I'm going to select image and I'm going to upload from computer.
- The image I want to use is this one.
- And I'm just going to come out here.
- So, I'm just going to leave it as it is.
- And I'm going to close this dialogue.
- Next, I'm going to insert a text.
- So, I'm going to just type let's let me get closer so you can see what I'm typing.
- Let the adventure begin and I'm going to change the font to Monzerat.
- So, I'm going to just show it's actually checking for me from the top of the rectangle.
- I just I'm just going for a relative um position 160 from the left, 220 from the top.
- So, I'm just going to move my So, it's two 220 214.
- Select the frame and we're going to change the frame the fill the frame.
- Select the frame and we're going to change the fill of the frame to black.
- And I'm going to come over here and on the right side of our screen or our frame, we're going to now create the content for our form.
- I'm going to insert a text.
- So, I'm going to write create an account.
- I'm just going to sort of bring it around here.
- So, I'm just going to click on R and I'm just going to create a rectangle.
- So, I'm just going to click on T so I can insert a text box.
- And I'm going to change the um weight to regular.
- I'm also going to change the font to enter.
- I'm now going to make this an auto layout using shift and a.
- And I'm going to align I'm going to align this text this frame so that the middle of our text is aligned to the top of this rectangle.
- I'm just going to move it one more time so that it's aligned 15 to the left of this rectangle.
- I'm going to select the rectangle and the text and I'm going to group it.
- I'm going to zoom out and we are going to use this reuse this fields to create our other items.
- So, I'm just going to create a bunch more.
- So, I need a total of five fields and I'm just going to create all of it.
- I'm going to change this to last name.
- I'm going to right click.
- Let's go to plugins and I'm going to run iconify.
- I'm going to select from icon set.
- So, I'm just going to just grab a copy and then bring it into my frame.
- And I'm going to change the Let me grab this.
- I'm going to bring it to this rectangle.
- I'm going to leave the dimensions as 16 by 16.
- I'm going to zoom out, select all of this.
- I'm going to select all of these elements and then group it again.
- I'm just going to make sure I have the proper alignment.
- I'm going to select this, align it to the center first, and then it should be 15 from the right of our rectangle.
- So, I'm just going to click on R and just draw a rectangle.
- I already have it on my clipboard and I'm just going to paste.
- So if you want to change it, all you need to highlight this terms of service and then change the color to this green color.
- Select this and then in fill change the color to um let me just pick something different from the green color I have.
- So in your own case when you type in the text just select terms of service and then change the color to this.
- I'm opening my notes and then doing it in this project.
- I'm going to bring this here.
- Select this two the rectangle and the text.
- I'm going to select this um last group and this one.
- And I'm going to select all of these items.
- And then I'm just going to group everything.
- So I'm going to click on T to insert a text.
- And I'm just going to type create account.
- I'm going to create an odd layout with this text.
- I'm just going to click on T so I can insert a text.
- And I'm going to highlight this sign in.
- I'm just going to change it to that green color.
- I'm going to change the size of the text.
- I'm just going to bring this two.
- I'm going to zoom out.
- I'm going to select all of this.
- I'm going to use Alt H.
- And I'm or I'm aligning their horizontal centers.
- So I'm going to move this group.
- And then I'm just going to move this so that it's on the center of my frame.
- I'm just going to run it in the prototype view so you can see what it looks like.
- So this is what our form looks like in the prototype view.
- You can go around and play around with, you know, different things.
- If you want to watch longer projects for UIUX design in Figma, you can check out the description box below to the links to those videos or the courses available on my channel.


### Is This The BEST FREE Fitness App For Free Workout Programs? | Boostcamp Review
https://www.youtube.com/watch?v=ffvAAQ3pt2c
## Puntos densos

- I review tech and apps, and today, let's talk about one of the best valued workout apps on the market right now.
- It's specifically created to be a free workout tracker, but more specifically, actually has over 11,000 free programs that are accessible to you for free.
- Today, we're going to do a deep dive of this insanely valuable app and do a full review of what makes Boostcamp so good, how it can track your workouts, cover the paid features, and most importantly, is it actually worth your money?
- So, first, let's talk about the app experience.
- So, first, let's talk about the programs tab.
- Of course, you can actually build your own program if you like, but that's not what we're here to talk about today.
- So, each free or pro program shows a small tag on the top right corner stating whether it's free or pro.
- And they also offer gender-specific options as well, and all of this is built directly right into the app for free.
- So, programs such as Insanity, which is something that we're familiar with and I've done videos on, but also Westside Barbell, if you're interested and know that, that's also built into the app. [music] Or, if you have really big YouTubers and fitness creators that you follow, likely that their programs are also built into Boostcamp as well.
- But, with Boostcamp, not only can you find multiple versions of Insanity for free on the app, but if you join the program, you can select exactly how many days and which version of Insanity you want to do, which is so [music] convenient.
- Now, once you join the program, you enter your maxes and it will automatically update the program for you.
- Best of all, the app includes a progressive overload feature that automatically increases your reps or weight on your next session.
- Okay, now logging your lifts is also super simple.
- Another nice touch that I enjoy about the Insanity program on the app itself is that it shows your percentages based on the maxes that you inputted for yourself, which is going to give you a great indication of what you're lifting and more knowledge about how you're lifting.
- Okay, now let's talk about the train tab.
- Now this tab shows a ton of widgets for a quick glance at your lifting stats.
- You can see the progress of your current program along with a few nice widgets showing your workout streak, lifetime stats across all your workouts, and your body weight and progress photos if you choose to use them.
- Next, let's talk about the analytics tab, and this is more of a pro feature.
- So here you can see your strength score, muscle tracker, training trends, and exercise analytics. >> [music] >> So the strength score is essentially a score that measures how strong you are relative to your body size.
- Regardless, I absolutely love this feature and we'll get a little bit more into it later in the video.
- Because it's simple, it's easy, it's no distractions, and of course it's easy to read.
- And it's a great way to compete with yourself, your friends, and other creators, or maybe inflate yourself and your ego, especially when you see that you lift more than the CEO of the app.
- Now, before we get to whether it's actually worth it or not, I do want to get into a couple more things that I love and dislike about the Boost Camp app.
- To my surprise, I absolutely love the fact that the Boost Camp app actually directly connects with the Apple Health app.
- So, if you want to close your rings, rest assured, you can absolutely do that with the Boost Camp app.
- Now, let's talk about some things that I dislike about the Boost Camp app.
- Now, on number one, I really wish that this app was able to connect with the Apple Watch for a couple of reasons.
- Number one, being able to bring your watch and not your phone in the gym to work out with the Boost Camp app would be huge.
- Now, I was talking to the CEO of the Boost Camp app, and they were telling me that this is a feature that will be coming out in the future.
- Now, another thing that I don't necessarily dislike, but I think they can improve on or add to is add just a little bit more personal questions into the onboarding process of the Boost Camp app.
- That way it can help match more programs to my needs and make it a little a little more personalized so that I can actually focus on finding the correct program for me instead of sifting through 11,000 programs.
- But honestly though, I don't think it really even needs one considering the fact that this app is pretty much free already, so you do get a ton of value there.
- Guys, Boostcamp app is essentially $0 on the App Store and it's completely free.
- At the very least, it's worth the download just so you can sift through the programs at your own convenience.
- If you guys are interested in more app reviews, tech and also tech wearables, make sure you subscribe.


### SHRED vs Fitbod | Which Workout App Is Better?
https://www.youtube.com/watch?v=tkFrY_Z1aoA
## Puntos densos

- Today, I'll be comparing two of the most well-known AI-powered fitness apps out there, Shred and Fitbod, to help you figure out which one might be a better fit for your training style and goals.
- It's centered around daily workout generation based on muscle recovery and your past performance.
- Now, I've spent real time with both of these apps, testing them at home, in the gym, on days where I felt great, and on days I barely even wanted to move.
- So, in this video, I'll walk you through how they work, how they feel, and which one might be a better fit long-term, depending on what keeps you consistent.
- Your goals, your training location, and the equipment you have access to.
- You go through a few prompts, pick your gear, and the app instantly starts building workouts.
- You still enter your goals and your equipment, but you also choose how you want to train.
- So, you're not just thrown into a workout.
- You got videos walking you through everything, so even if you've been lifting for years, it still feels polished and personalized, like someone actually built it for you.
- With Fitbod, you're reacting to the workout it gives you.
- With Shred, it feels like the app is leading the session and that kind of shifts your mindset at the gym.
- You tap through at your own pace, rate how each set felt, and it logs everything automatically.
- You're essentially running the whole session by yourself and that works totally fine if you're already locked in and just want a smooth way to progress, but it can feel a little dry over time, more like updating a spreadsheet than being guided through an actual workout.
- Shred feels a lot more involved.
- That built-in variety can be the difference when you're trying to keep consistent for more time than just a few weeks because if you're anything like me, you know that just sticking with one plan kind of gets boring.
- Now, both apps do a solid job tracking your workouts, but they value separate kinds of data.
- It logs everything automatically and you get a visual breakdown of your total volume, personal records, muscle group frequency, you know, all of it.
- Shred tracks your lifts and consistency, too, but it leans more into how the session feels rather than the raw numbers.
- The AI adjusts your plan week to week, adding weight, changing tempo, or tweaking rest based on how you're performing. >> [music] >> It's really like having a coach keep tabs on your progress.
- And what's cool is how deeply it customizes your equipment.
- Now, Fitbod lets you make equipment profiles, too, but it's a little more rigid.
- So, both apps will grow with you, but Shred does it in a more flexible, hands-off way, and the gap only grows the longer you use it.
- After a while of repeating that, it can feel kind of flat, especially if you're someone who needs variety or feedback to stay motivated.
- Shred builds that engagement in from the start, between the pacing, the class options, the real-time coaching, it just feels more dynamic.
- If you're already self-motivated and just want a clean way to build workouts, track your lifts, [music] and steadily increase strength over time, Fitbod handles that very well.
- Between the coaching cues, the structured pacing, and the built-in variety, it makes every session feel more engaging.
- So, while both apps are capable of helping you improve, Shred is just more complete.
- The experience is smoother, more engaging, and easier to stick with long-term if variety and consistency matter to you just as much as results.
- If Shred sounds like it might be a better fit for your training style, check out the link in the description.
- Also, if you're interested in working with us or sponsoring future video, just reach out using the email in the description down below.
- And if you have any questions or want to share anything about your own experiences with either app, just drop them down in the comments.



---

# Parte 2: Apéndice completo (todas las fuentes, sin resumir)

## AI personal trainer app architecture

### Auto-Regulation: How to Train Power Without Digging a Recovery Hole
https://www.youtube.com/watch?v=716nCgYxYUc

All right, welcome back to my channel,
guys. This one is going to be about auto
regulation throwing. It's a term some of
you may or may not have heard before. A
R E G is the abbreviation. I've talked
about it a bit on my social media.
>> [music]
>> Using the principles you'll learn from
this video, you're going to be able to
evaluate each session you have whether
you are moving the needle forward,
stagnating, or digging a recovery hole.
And you're going to learn all of this by
understanding the principle of A Reg,
auto regulation. And we know hard work
was never the goal. Most of you watching
this probably work harder than most of
your peers. That doesn't entitle you to
success. Hard work is just kind of a
prerequisite at this point. Um and we
need to do it smart, really. If we're
working hard in a poor direction or with
poor structure, a lot of times it can do
us more harm than good. And that's the
reality of the situation. I know that's
a frustrating situation to admit, but
that's just the way baseball is at this
point. I'm sure there's kids in your
team that you work harder than that are
just better than you or they're ahead of
you for a variety of different reasons.
This video and what we do at Magna as a
whole is there to help you close the gap
on them. This all goes back to the '60s
and '70s when there was a Soviet Olympic
lifting coach. I might be pronouncing
his name wrong. There's a bunch of names
in this video I might pronounce wrong.
Prilepin coming up with the idea of the
effective dose of training, right? If
you do too much, you dig a recovery
hole, you might not even get the
adaptation. If you do too little, you're
not getting the most out of what you
could have done that day, and in turn
you're leaving adaptation on the table
as well. And again, this guy's coached
thousands of Olympic champions, and
these were some of the findings that he
had.
And this is all relating to power,
right? Power is a very finicky thing.
Hypertrophy, strength, it's a little bit
different. Velocity as a whole is a
little bit different. Power, you know,
quick force application. Power is like a
dunk, a pitch, a swing. All of those
would be examples of power. They kind of
live in a different category, and
sometimes they're harder to adequately
train, maintain, and, you know, do
without injury. And it's no coincidence
that those are kind of what is required
in elite athletics. Do too little, it's
not enough stimulus for your power to
adapt. Do too much, your power falls off
a cliff, and you potentially maybe
opening yourself up to getting injured.
And you may be wondering how this
applies to throwing. We will tie all of
that in. I know if you've watched my
videos before, just know that we always
I want to lay out all the context I can
first, and then bridge it all together
so it can apply to you as a baseball
player. Moving a couple years forward,
we have Bondarchuk, who's another great
Soviet coach, except he actually is the
in the hammer throws. This is a throwing
event that he was mastered in, and
essentially his big breakthrough
groundbreaking idea was that we're not
going to follow a set reps plan. We're
going to develop ways to allow the
athlete to tell us what their best
output is that day, and then follow
that. So, like building the program
around the athlete instead of
the athlete around the program.
And we see that happening a little bit
more often now, but it goes deeper than
what you may conventionally see. Some
people might just be like, "Oh, VBT,
that that's that's all this is." It's
it's much deeper than that. I'll talk
about VBT versus A-Reg later in the
video.
And the reason why this is so beautiful
for throwing specifically is it's such a
fine motor skill. A plethora of other
factors that sometimes we can't control.
So, the ability to have auto regulation
and to be able to have flexibility
within what our our reps are for a
certain throw is extremely valuable.
It's not like a back squat or something
else. It's so much more like CNS
demanding that it can vary wildly. So,
when we have this framework in place, we
can really avoid senseless injuries, and
we can stack the best reps possible each
day, taking into account all of these
other factors. We're never going to
actually know what all those are each
day and be able to be like, "Okay, this
is what the number we should do today
is." Because of our Whoop says this, and
I feel like this and all that, that's
not going to work. What we can do though
is we can have a set percent fatigue cut
off and go off of that based off of our
best bullet that day. And that is
foolproof essentially. We'll talk about
how we apply that later. Okay, and then
moving on to the next point, again, I
don't know if I'm pronouncing this
right, Peria Blanco study. This is 2017.
So super recent, about 10 years ago. And
this is regarding the back squat, so not
necessarily a power movement, but the
results were extremely interesting. They
had two groups, both performing back
squat. One group performed it and they
had a bar speed measuring it. One group
performed it to 40% of a drop off from
their best bar speed of the day. So
they're grinding out more reps. They did
more total reps.
You know, that very David Goggins grind,
right? It's very prevalent in baseball.
It's prevalent in athletics. Like you
got to you got to grind for stuff.
Nothing comes easy for you. Not
necessarily the case. The other group
did 20%. So they stopped when their bar
speed dropped by 20%. So they stopped
50% earlier
than the other group, right? That's it's
kind of a big difference. And the
findings were super interesting. The
group that
did more grindy reps and kept going,
they gained more muscle mass than the
other group. More lean tissue, good,
normally a good thing. When you look at
the lean tissue, it was more it was
favoring slow twitch muscle fibers. So
not the ones responsible for power
largely. Interesting. You look at their
power testing compared to the group that
cut it off early, significantly less
power displayed. You look at the group
that cut it off at 20%,
they had significantly more power when
they retested 6 weeks later. So, lean
tissue isn't bad. I'm not going to sit
here and say doing these extra reps is
going to make you weaker. Not
necessarily. You probably will get
stronger. Will you get more powerful?
That's looks like no. And what is the
biggest correlation to ball velocity?
Power. Obviously there's times when
we're going to be grinding out reps to
get more lean tissue, but the majority
of y'all like, bro, it's the power. The
power's where the sauce is. You look at
the best athletes, they're quick and
powerful and they have great timing,
right? They're not necessarily the ones
grinding out the extra back squat rep
all the time. Sometimes there's a time
and a place for that, though.
So, basically, in general, the consensus
from this is more is not necessarily
better. More effort is not necessarily
better. Grindy reps are not necessarily
better for throwing, and in fact, they
may hurt your power. So, when we apply
that to throwing, which we will do later
on, you can see where this is going
here, right? What we're actually going
to put something in place, we're going
to put a formula in place, so we don't
accumulate a bunch of mid reps, which is
what a lot of you guys do in terms of
pitchers for throwing on high intent
bullpen days.
It's no coincidence that the Soviets
have their fingerprints all over this
idea, considering they're
the pioneers of athletic performance
through the 50s all the way to the 90s
essentially, with a lot of innovation
and a ton of world champions in a
variety of different athletic events,
especially power-based ones.
So, we'll talk about applying this to
throwing in in more detail here. The way
we use it with Magna is we have about 1%
to 5% cutoffs. And if we have a 1%
cutoff, the way that would look is you
are warming up for, let's just say,
shuffle throws. And you get your first
number, right? You warm up and you throw
a couple times, and say the first throw
is 88. You put 88, and now if there's
anything below that 88, you are done for
the day. So, one, you have that monkey
over your back of you got to keep
climbing or at least stabilize, or else
you're done for the day. That's where
the auto-regulation comes in. And as you
climb, your cutoff will climb with it.
So, next throw 90, for example. Then you
can look right here, put on the screen,
you can see the cutoff. So, 1% is a very
tight cutoff. You can see the new cutoff
when we put 90, and we'll do another
rep. Let's do 92. You can see the cutoff
rise again there. Let's go to a 94. You
can see the cutoff rise again.
We'll do another 94. We're accumulating
reps here. Okay, let's say now we're
going to do a 92, and it's going to tell
us to stop. 1% very tight cutoff. 1% is
like we are training the absolute max
power we have. We don't use that too
much. I just wanted to use it for the
example here. You can see how it works
in practice. If you don't have it that
day,
you're probably going to end up below
your cutoff earlier. And then And then
you're going to get stopped and we're
going to live to fight another day
instead of just digging mindless reps
way below what you're capable of because
you're frustrated and you're banging
your head against the wall. And that's
the reality for a lot of you guys out
there. The cool thing about this is we
can apply this to other power movements.
You can see here I'm doing a
physio ball lat med ball throw. And I'm
radaring these, right? If you have the
ability to radar different med ball
throws, you can apply it to these. It's
beautiful. You can see what I'm doing
here. Once I hit a cutoff, I'm done, but
I can accumulate all of my quality reps
for that day. Someday it'll be more.
Somedays it'll be less. We can do this
with vertical jumps. We can do this with
broad jumps where we have a tape
measure, right? And you can input it
based off of the cutoff. We built all of
this in our app to track in different
variations, too, which is beautiful. You
don't have to do the algorithm if you
work with us. It's It's all in there.
Now, how does this work within health
and longevity? My hypothesis is injuries
occur when you intentionally expose
yourself to stress that you aren't
prepared for that day. And so that can
happen
out of game a lot. We see it a lot where
people are going through a velo phase.
Maybe their body isn't quite ready that
day, but they they just grind through
it, right? And they're banging their
head against the wall. And all of a
sudden, now they have a significant
injury. They're sidelined for 6 months
plus, maybe even a year plus if it's a
UCL or labrum injury. Oh, now say they
were running A-Reg. What happens? Okay,
you your your arm isn't feeling great
that day.
Whatever drill, we'll go back to the
shuffle drill. Let's say your first
throw is 87. Normally you're a guy
that's around 90 on these. Okay, your
first throw is 87. Now you're 88. You're
trying to gut through it. You got a 89.
And then And then you have an 88. Then
you have an 85. If you're running A-Reg,
you are now done for the day. You're no
longer digging yourself a recovery hole
cuz your ego's pissed off about your
number. What you're doing is you are
going to assess why you felt like that,
make necessarily make necessary changes,
and move on. Right? Versus the other
guy, he hits that 85 and he goes, "Oh,
no, that's my All my friends just saw me
throw that. I'm pissed. I'm going to
throw another one." And he maybe climbs
back up, and then he just keeps
grinding. And suddenly suddenly he's
throwing 15 extra shuffle throws cuz he
was pissed about his number while his
arm was in a vulnerable state. And then
that's where that's where you're exposed
to injuries, right? Injuries rarely just
like are freak things a lot of the
times. There is an element that we can't
control, but you better be sure that
you're controlling everything else that
you can before you complain about the
freak injury stuff. And you can see the
contrast between those two athletes, one
that is running A reg with us, or one
that is just going in there and going,
"I'm just going to keep throwing cuz I'm
pissed about my number that day." I'm
sure you guys have been through that.
Some of you guys have done that and not
got hurt. You know, great, but if you
keep doing it, you're just increasing
your risk. And the overall goal here is
accumulating quality reps. That's all
that matters. It does not matter if we
accumulate bad reps. If anything,
according to the
Peretta Blanco study, that is going to
hurt our power. So, we want to avoid
that. At best, that's just hurting our
power and we're not getting At worst,
we're getting hurt from it. I mean, some
days we're only going to accumulate four
throws. Other days, we might accumulate
way more than what we had scheduled cuz
our body was ready for it that day. And
we used it We used math essentially, and
equations, you know, that have been
formulated through brilliant Soviet
minds over the last 40 years to help us
and help facilitate our training instead
of just doing it all on your own. So, if
this is resonating with you, I would
encourage you to book a discovery call
with Magna. You can talk with me and
Mason. You know, we had Nick Carney
here. I'm really excited about Nick.
He's going to get the chance to pitch at
Memphis next year. He was at Juco in
Mississippi the last couple years. Tough
freshman year, but then really put it
together sophomore year. We used auto
regulation throwing with Nick. We're
currently using it now too as he builds
back up to get ready for the fall at
Memphis. And you can just see auto
regulation in practice and and how it
can impact different athletes. So, I'm
glad that that Nick was able to hop on
board with us about about 7 months ago
and the results have been great for him
and he put together a really solid year
in terms of health and in terms of
performance, which is just the best of
both worlds. I'll throw some video of
Nick up there. When he first hopped in
with us, he was he was dealing with
shoulder pain and he was coming off a
really tough year and we use some auto
regulation within his program to really
set him up to accumulate a good amount
of innings and put himself in a better
spot where he had scholarships from a
handful of Division 1 schools and he
ultimately got to commit to go play in
the American conference. He's going to
be pitching against East Carolina. He's
going to be pitching against quality
teams now.
Um so I couldn't be more happy for Nick
and if you want to if you want to alter
your career like Nick, then just book a
discovery call. There's zero pressure um
and you can see how we do things and get
to know us a little bit better. So I
wanted to touch on VBT, velocity-based
training. I'm sure you guys have seen
the tendo units. You may have used one
in the past and this I get how this can
seem like oh this is just VBT. How is
this different? So the thing is you can
have VBT without auto regulation because
it's a fixed velocity zone. So that's
the fixed thing and really the only
thing flexible is the weight. You still
have to move it within that velocity
zone. All good VBT is a form of auto
regulation but not all auto regulation
needs VBT. In fact, my favorite methods
don't include it. So VBT uses like an
absolute target within the bar speed.
But
what A-Reg does is a velocity loss
target. So we stop when we lose a
certain threshold of velocity,
percentage off of it. So it's relative
to today's max max. You find today's
peak and base off of the velocity drop
off from that, that lets you know when
to stop or when to keep going. And the
baseline is reset every single day. So
it's extremely malleable. It's more
flexible than VBT. So most guys train
velocity by trying to chase an absolute
number.
And at Magna we're not. We're finding
your best throw using A-Reg and then the
percentage off of that. So some days
that's going to be 94. Some days that's
going to be 89. The method doesn't care.
It adjusts to you. That's the difference
between using a tool and actually auto
regulating. So, you might be watching
and being like, well, I'm a starter. I
have to throw more than one inning.
Like, I can't do a 1% cut off. In that
case, we can expand the percentage cut
off, right? We can lean towards five,
maybe even past that. And we're still
training our best reps within that cut
off, right? So, if you're a guy that
loses velo, or you're a guy that as you
accumulate volume, your stuff really
diminishes, this would be a great way to
train that. Because we're still we're
not accumulating those shitty reps,
which is the biggest part there. So,
what a 5% cut off would look like, I'll
show you another example here. We can
just do a regular mound velo, and we
would input our first first bullet,
let's say it's 89. We can see we now
have more leeway here, but we still have
a cut off. That's the biggest thing is
we need that cut off to be able to adapt
to us daily. That's where all the
marbles are. And that cut off is based
off of our best bullet for that day,
which adapts to us every day, which is
why it's so beautiful. So, again, I hope
you guys enjoyed this video. One of the
simplest ways without training with us,
without doing anything to try this out,
would be to like find a piece of tape
and tape it on a wall as high as you can
jump and see if you can just keep
hitting that piece of tape. And then you
stop when you're done. That's like bare
bones, one of the simplest ways to apply
A reg. Or touch the basketball rim
um at a certain spot or the backboard
every time until you can't. That's just
one of the simplest ways to apply A reg.
So, maybe you go try that on your next
power day and see how that feels because
you're actually getting the most out of
what you have each day, which is again,
the most beautiful part of this. So,
if you guys enjoyed this video, all I
ask is that you like and you share it
with a friend that may need it. Again, I
hope you all keep crushing.

### Claude Code Built My AI Fitness Trainer (Kettlebell Coach, Full Cost Breakdown)
https://www.youtube.com/watch?v=MaHITJel8ew

That's not a video that I filmed. That
is an AR trainer that I created using
Kick Field. It's looping seamlessly and
it's coaching me through a follow-along
workout using an app that I built myself
using code code within a couple of
hours. I'm not going to sell you
anything in this video. I just want to
show you what's possible with these
tools today and also show you how much
it cost to create it yourself. I've been
using kettlebell follow-along workouts
for years now. I would log on to
YouTube, try to find a workout and
sometimes it's really hard to find
workouts that suit my needs. Sometimes I
might only have 20 or 25 minutes for a
workout and some of them go for 45 and
maybe it's not the type of training
style that I'm looking for. Maybe I'm
looking for something that's more in
cardio or fitness and some of the
workouts that are in there are very
specific.
It works for me. I can do it at any time
from [music] home and I have my
kettlebells in the back there. The one
problem though is that everything's
baked into a single fixed video. Set
duration, set exercises, set rep scheme.
If I want a shorter workout or a
different exercise mix, then I need to
go searching for a new video and to be
honest, sometimes that video doesn't
even exist yet. So I built a version
where the trainer footage and workout
schedule are completely [music]
separate. The workout is a config,
format, duration, exercises, reps. The
application composes the exercises to a
fixed time sequence. The player just
plays the sequence against a set of
looping clips that it has access to.
There are three things that make it
different from just another fitness app.
Number one is that it's fully
configurable. There's the same trainer,
the same clip library, any workout
format, EMOM, ladder, intervals, [music]
AMRAP. Change the config and the whole
session changes. There's no additional
filming required. The trainer footage
isn't stock video. It's all completely
AI generated, [music] seamlessly looping
and synced to the timer. Not a fixed
length video that I need to cut around.
Number three, it works completely
without Wi-Fi. It's a fully offline and
progressive web app, meaning that you
can take it with you on the go and use
it whenever you want. I do plan to host
this on my website so you can check it
out. I'll drop a link in the
description. Now for the architecture.
There are three phases all driven from
my cloud MD file. And I did this so that
the build stays consistent across
sessions. I do plan to upgrade this app
later so I wanted to make sure that the
history of the app development is all
kept within that cloud MD file. Just so
that when I do make these updates, the
new session will have all of the context
of what I've done so far. So the first
thing that I started with was the engine
and the HUD. So I didn't go into the
detail of putting together the videos. I
just wanted to make sure that the
workout engine was working correctly
first. So I wanted to give as much
flexibility as possible to be able to
set the duration, to set the exercise
goals, whether it's fat loss, strength,
cardio. And phase two is where I used
the Hicksfield MCP to build out all of
the images that would eventually become
videos. And then phase three was wiring
up the video player just so that all of
the images [music] could become videos
and then be played according to the
workout timer. The engine is a one pure
function. It takes the config and then
figures out the workout from there. So
it will return a list of segments. Each
with an exercise and a duration against
it. And a met value for the calorie
estimate. Every format is just a
different compiler that produces the
same segment shape. The player doesn't
care about which format it's running. I
also programmed the timer to work in
such a way
where it deltas against the segment
boundary. Meaning that a 20-minute
workout doesn't drift against the wall
clock. I also added a line of code to
make sure that the browser doesn't
freeze when it's advancing to the next
workout. I think the training clips are
the most interesting part. This is where
I spent most of my time. The actual
application build was pretty
straightforward, but when it came to
refining the clips for the trainer and
getting those clips right, that's where
things required a bit more work and
exploration with Hicksfield. I had to go
through various different iterations to
make sure that the the clips were right
and that they were that that were framed
correctly. And also to make sure that it
was a smooth animation throughout.
You'll see in some of the examples that
I didn't quite get there. So, this is
something that I'm still going to
continue working through to to try and
perfect it. The one trick that I did
learn is you have to make sure that the
start and end clips are exactly the same
>> [music]
>> just to make sure that there is an
invisible gap. The other thing that I
did was add a subtle cross-fade between
the end and the start clips just to make
sure that that gap once again wasn't
visible to the eye. Before doing this, I
noticed there was a bit of a flicker
when it was when it was at the end of
the loop transitioning to the beginning
of the clip. That was a little tweak
that I made to make it look more
seamless. Phase three was when I wired
up the video player. Whilst one clip is
playing, the next clip is actually
preloading in the background so that
it's ready for when that exercise ends
>> [music]
>> and the new clip is seamlessly loaded up
without any delay. As I said before,
this took a couple of hours for me to
build in Claude Code. It took two
sessions, so I used Fable up front just
to lay out the plan and to get all the
all of the foundation set, and then I
was able to move to a cheaper model to
do the actual build.
>> [music]
>> And as I went through and continued to
iterate on this, I added some more
game-like features just to give it that
premium feel. Now, this is what brings
me to the numbers. How much did it
actually cost me to build this
application by myself? So, just to be
clear, this isn't a guess at all. This
is the actual numbers that I pulled from
my Claude and Higgsfield accounts. So,
you'll be able to see exactly what it
takes to build out an application like
this. So, it was two Claude Code
sessions, about 1,100 assistant terms
with Opus, Fable, and Sonnet. At
standard pay-per-token API rates, it
works out to be roughly $349.
For Higgsfield, it was 511 credits, and
that was across the hero images, the
reference poses, and I ended up creating
about six looping clips. And at
Higgsfield's top-up pricing, it works
out to roughly be about $25. So, if you
add everything up, about $420 to create
an app like this. Like I said, it's not
finished, but I think I have more than
enough room in my Higgsfield budget to
bring the app more to life, to fix up
the trainer, to create more looping
videos, and to also generally uplift the
app to make it more premium. But also
just to be clear as well, I use the
Claude Max plan. So, it's not like I had
to fork out over $400 to build this.
This just comes inclusive with my plan
and I had some extra credits left over
anyway. I have more than enough usage
before it before it resets. So, I wanted
to use this as an experiment to see how
far I can push it. I've had this idea
for a while, so I wanted to finally bite
the bullet to see how I could bring it
to life and I was so surprised with how
quickly I was able to do it. So, there
you go. That's the Kettlebell Coach. It
was built for specifically me. It's
something that I'm going to be using
every week to help monitor my fitness
and to help streamline my workouts and
to make it more calculated. And also
making sure that I'm working out with
enough intensity. I've been partnering
this up with my with my Apple Watch. So,
I have all of the health data that goes
along with these workouts and I'm using
it to constantly fine-tune. If you want
to know more detail about this project
or if you want to or if you have any
questions about how I was able to create
the videos, please leave a comment in
the description below and like and
subscribe if you have if you want to see
more of this content. Like I said, I
will leave a link to this Kettlebell
Coach in the description. I'm going to
host it on my website so you'll be able
to see how it works and see some of the
quality of it. And like I said, this is
not a pitch. Just wanted to show you
what's possible with the AI tools today
and I'll see you in the next one. Bye.
>> [music]

### Finally a Gym App That Doesn't Suck | WorkoutBuddy
https://www.youtube.com/watch?v=9YqkzTY_Zhk

Train, track, progress.
Workout Buddy is built for real
training. No fluff, no guessing, just
structured workouts and clear tracking.
Follow serious training plans, then log
every exercise set, rep, and weight as
you train. Review your stats with clear
analytics. Use the workout log and
progress tracking to stay organized.
Workout Buddy helps you train with
structure and measure real progress.
Download Workout Buddy now and start
training with purpose.

### FIT8: entrenamiento, nutrición y acompañamiento en una sola app
https://www.youtube.com/watch?v=labH03l2p64

Con FitAid, avanzar deja de sentirse
confuso.
En FitAid tienes todo en un solo lugar,
tu nutrición, tu entrenamiento, tu
seguimiento y las herramientas que
necesitas para avanzar cada día. Por eso
tu alimentación deja de ser una duda.
Con el respaldo de tu nutriólogo, sabes
qué comer, en qué momento y cómo
mantenerte enfocado en tu objetivo.
También cuentas con suplementación
guiada.
Tu coach te acompaña con rutinas claras
para avanzar mejor. Y para dar
continuidad a tu proceso, puedes tener
citas de seguimiento por chat o llamada
con tus profesionales. De forma cercana,
práctica y oportuna. Además, cada avance
queda registrado en reportes claros. Así
puedes medir tu adherencia, revisar tu
progreso y tomar mejores decisiones.
También puedes agendar citas con tus
profesionales y elegir horarios que se
adapten a tu rutina. Para dar
seguimiento constante a tu proceso. Con
FitAid Academy sigues aprendiendo y
avanzando.
Todo eso y más es FitAid, nutrición,
entrenamiento y acompañamiento en una
sola app.

### The Outsiders: Apple-Level UI Designed For Building Trust  | App Breakdown #81
https://www.youtube.com/watch?v=l1j7jGHQJaM

Today we're breaking down the 2026 Apple
Design Awards finalist The Outsiders, a
tracking app built specifically for
endurance athletes. Welcome to episode
81 of the app breakdown. If you're new
to the channel, my name is Jose. I'm a
professional app designer and in this
channel I review apps from all sorts of
categories and give you the design
insights. So if you're an app nerd or
design nerd, make sure to subscribe.
Let's go into Outsiders. Opening up the
Outsiders app for the first time here.
Beautiful illustrations. I'm expecting
this app to be very beautifully
designed, not only because of what I saw
on the App Store itself, but because we
have already reviewed an app from the
same team called Gentle Streak and it
was a very good one. So I have high
expectations here. App of the year and
Apple Design Award.
Let's hit continue. Very nice bold CTA.
Just text coming in, nothing too
special. I will say I'm not sure if it's
because the foot is very colorful and
occupying a lot of space on the screen,
but it's distracting me a lot from the
text. Like the bottom of this screen
feels very very heavy compared to where
the actual information is up top. So I'd
maybe switch that up cuz I don't think
users feel like reading this at all. So
let's just continue.
Okay, glad we're here. And now we have a
nice little custom onboarding. Let's go
with Jose.
Oh, beautiful shared element transition.
I'm not sure if you noticed that, but I
input in my name and then it went to the
next screen and now it plays a beautiful
animation asking me for permissions. So
actually I really really love this
entire animation. It felt very under
control, not rushed at all, but at the
same time not slow. Very cool. So we
respect your privacy.
Bring your history on board. Once again,
such a beautiful animation just for
asking for a permission. This shows
care. Like I trust this app already and
because I trust it, I'm more likely to
connect it to my health, which is what
I'm going to do now. So, I'm just going
to do turn on all, which is not
something I recommend you do for apps in
general, but I do trust this team. So,
stay on track. Once again, they're
showing it to me inside the phone.
I have mixed feelings about these kinds
of illustrations and animations that
show the phone itself. On one end, they
are extremely obvious. And if you assume
that your users are dumb or impatient or
that they're focused on some something
else, it is good to be extremely
obvious.
On the other end, I really really
dislike displaying a phone inside a
phone. Like, it just feels redundant,
but I get why people do it. I've done it
in the past, too. So, stay on track.
Let's just go for it. Very very clever
way to ask for notifications. Notice how
they don't even mention the word
notifications anywhere. They mention
reminders. They tell you to stay on
track. They're just giving you the
value. It's like, here's the value,
here's the value, here's the value. Do
you want it? Yes, click allow.
Beautiful way.
So, let's click allow here.
Once again, we have these signature
illustrations. I don't know who does
this, but they are phenomenal. I almost
want to put like a painting on the wall
over this. It looks so good.
Let's hit let's go.
And we are at the paywall. So, it seems
like we are at a paywall on top of the
home screen. And the paywall seems kind
of janky, not going to lie. It feels
very much just like a standard paywall,
whereas everything else before it was
like custom-made with care. So, there's
clearly a distinction here. And the logo
or the icon up top is kind of pixelated.
So, I'm not sure what's going on here.
Let's close the paywall for now. Try not
to judge it too much. And we're once
again in a custom, beautifully built
screen. So, you can see that it's very
Apple style in its nature. You have the
today on the top left with the date,
profile on the right. Then we're going
to look at the main screen later, and at
the bottom we have a standard navigation
style with today, progress, workouts,
and a star that I'm assuming just leads
you to the paywall, but I'm not sure.
So, let's actually start by hitting the
star. Confirm if it's the paywall, and
it is. So, now we know what the icon is
for premium. But, let's actually look at
some of the information that they're
displaying us on top of this beautiful
illustration here on top. So, it shows
that today I am at prime readiness.
All the metrics agree. Okay, so it's
just telling me that I'm ready for the
day. I've been a user of Whoop in the
past, so I'm used to some of these
metrics. Let's see, I have my training
balance here, then I have my body
metrics, and that's pretty much
everything that's on the home page. It's
a very, very simple home page. I
expected like more information to be
here. Usually these types of apps what
they do is they give you the main
information up top, then some secondary
metrics, and then try to like upsell you
into different things. In this case,
they just made the home page extremely
simple. This type of simplicity on the
home page usually can go two ways. You
either already have very good product
market fit, and so this does not hurt
metrics and actually makes people trust
your product more, cuz it never seems
like you're trying to upsell things.
You're just giving people their own
personal space that you can see I can
customize. We're going to go there
later. Or not upselling if you don't
have very, very clear product market fit
and good growth metrics can hinder your
growth. So, this would be a good place
for them to show me what I can do more
with the app and to upsell me into going
for the premium. So, I do understand
their choice, but it's something just to
keep in mind. Let's try tapping on the
main graphic on top where it says 99%.
Oh, and it does nothing. I was like 99%
sure that this was going to open some
kind of menu or like in-depth thing,
but it seems like it doesn't. So, let's
actually click on overnight data a
Okay. Beautiful expansion of this module
here. Look at that. It's these little
details that I really love. When people
design their apps with care and effort,
like this is just information expanding,
but they made it in such a cool way. I
love it. Then we have unlock full
access. That's going to just lead me to
the paywall. Training balance. Let's hit
that. There's a chevron, so it's going
to open a page. Very beautiful gradient
on the background. I actually really
love the way this page is just
structured in general. I haven't read
anything, but just like if I squint my
eyes, there's a very clear hierarchy on
all of the text, all of the colors, and
it just seems very, very balanced. So,
what we're seeing here is my training
load. I'm not sure how it is being
calculated cuz it's very rare for me to
actually use my Apple Watch or take my
phone when I do sports.
So, it's just showing me like different
data visualizations. This graph feels
extremely readable and very beautiful.
So, I do appreciate that. It seems like
I am detraining too much. Then we have
7-day overview.
It's not tappable, doesn't really do
anything. And we have here a way to
display information just in rows. So, I
have just been in detraining the entire
time cuz I don't really track anything.
And then at the bottom, we have the kind
of learn more section that I was talking
about that could be on the home before.
This is what I was talking about. So,
there's really nothing to do on this
page. It's just like information,
beautifully displayed information, etc.
But so far, the app seems very passive,
almost. I haven't found anything to do
yet, and I am on my first few minutes of
using it.
Let's go back into the home, try to tap
into some of the body metrics. Oh, nice.
So, here we have heart rate. I haven't
really been tracking heart rate, so it
has no information. You If you noticed,
they use the same style of transitions
as Apple Books does. So, if I open it,
it's like a page, but almost constructed
as a sheet. This might have a name, I
just don't know it. And if I swipe left
and right,
oh, I cannot do it.
Yeah, it just brings up the paywall. So,
if I paid
and I swipe left and right, I'll be able
to go between metrics just like on Apple
Books, you're you're able to go between
books. We have reviewed Apple Books in
the past. If you haven't watched that
video, go watch it now. And in this
page, it seems like we have very much
the same type of content organization
that we had on the training load page,
which is a good thing. It's consistency.
It teaches me to read the information
throughout the app, and it's just a good
way to reuse UI. Let's try hitting a
different time frame here.
Oh, okay. It seems that I can't.
So, there are a lot of locked things on
the app. Like, I can't even go back. If
I tap to go back,
it just brings up the paywall. So, this
app is very, very much for the paid user
and not for the free user, which is
completely fine. I have no issues with
that whatsoever. Let's try hitting the
customize at the bottom. See what that
brings.
I really love these customization menus.
Like, I know that they're kind of just
iOS standard. They don't really they're
not that special, but they're so clear
and so easy to use. I really love it.
So, let's turn on training form here and
turn off heart rate just to see the
differences.
Oh, nice. We have a new module here for
training form. Let's see what it looks
like inside. It seems like it's very
much the same type
of information architecture, which again
is just good usability of content, and
they changed the gradient on top.
Actually, very, very recently I've
designed something with this type of
gradient on top. Like, it almost seems
like a copy of this now that I look at
it.
So, let's go back and go into the second
tab, progress.
So, in progress oh, now we have a lot
more data here. This is much cooler.
So, we have the data on top, training
load, duration, distance with the color
changing with each of them, activation
energy.
Very cool. Actually, I really love the
way this looks. It just looks so light.
Then we have add a goal. Let's try
hitting that.
Workout type.
Okay, this sheet is very slow. I don't
know why, but I was just tapping and it
wasn't doing anything.
So, let's go workout type. Once again,
very slow. Let's go with dance for this
example. I'm a fan of these radio
buttons. They look quite cool.
Hit done. Okay, goal type. Duration.
Time frame. Week.
And your goal.
4 hours per week. Let's click add. Now
we have my training goals here on top
with the dancing man in the middle.
These types of rings and colors very
much remind me of Apple Fitness and
Apple Watch. I'm sure that's where they
got the inspiration from and rightfully
so cuz it's an awesome design. And below
we have some more data and different
types of data visualizations this time.
So, we have training focus. How do you
even read this chart? Okay, I have no
idea how to read this chart actually.
>> [laughter]
>> So, I'm guessing that's not the best way
to display it or maybe I'm just stupid,
one of the two. And then we have more
ways here, pretty cool and then always
the learn more at the bottom with
different backgrounds to separate
information from upselling. So, let's go
back.
Going to heart rate zones. Once again,
we have the same type of visualization.
In this case, I can see a long-term view
which I wasn't able to see before. Then
we have my fitness
that has the same data as before
and my cardio fitness. I'm not sure if
this is a good or not. Judge me in the
comments. Let's go back.
And try to hit
the workouts. So, once again, we have
information visualization up top, so
it's consistent across the three tabs
with the gradient there.
Then we have a summary of my trainings.
And if I tap each of the things, it just
changes the chart. Man, I am loving
these pops of color in the darker
backgrounds. It just looks so so so
good.
Like awesome job.
Okay, let's tap on the plus, try to add
a workout.
Add manually, see what this flow looks
like.
How did it feel? Oh, I cannot do this.
Okay, here's one thing that they could
have done better. This should look
disabled if I can't do anything about
it. So, let's actually select an
activity before. We're seeing the same
panels that we have already seen when
doing something.
And now we can actually select how the
workout felt. So, it seems like the
state that there was before was in fact
a disabled state, but it just didn't
seem like it.
Oh, I like this.
It's changing the color. It has the
haptics on the back. It's using the
width of the chart to show intensity.
I'm not sure about the use of color, cuz
to me purple doesn't mean extremely
hard, and cyan doesn't mean extremely
easy.
Uh so, for example, here I would expect
this to be harder than the purple. So,
the use of color here could be much
better. They could have played with the
darkness of each color. They could have
played with the tint. But anyway.
So, let's just do hard here and add. So,
now as you can see, there's a new type
of workout. Really love the monospaced
font for the the times.
And they're just showing the different
information that I just added. So, you
see how the graphs
change now. Very cool.
So, let's go into the cool down. Here,
we can see that it was somewhat hard.
There's once again, oh, a much more
satisfying way to log it. I love screens
like this one, especially when the CTA
also changes color. It's just like
chef's kiss. It's very simple, but it
makes a difference. And let's go back
and close out with just a reflection on
the overall design. Oh, it seems like I
am at poor readiness now out of nowhere.
So, I'm not sure what happened. So, one
thing you've probably noticed while
going through the app is that the design
feels extremely clean and familiar at
the same time. This is because they
mostly use components from Apple or that
mimic Apple very closely, which is a
great technique if you want people to
trust your app by default. Just give
them what they already trust and what
they already have in their minds as good
design and good apps. Of course, on top
of that, the team here has added a lot
of things that actually make this stand
out. It's not just copying Apple, far
from it, but it's
picking up the tools that Apple gives
developers and designers and just
really, really making them shine and
just using them everywhere and then
giving them your touch. I've talked
about this in a lot of episodes like,
don't reinvent the wheel when it comes
to designs, use the standards and give
them your own little taste, and I feel
like that's exactly what the Outsiders
team has done here. In terms of design,
I really love this app, especially for
UI and for information organization. So,
if you ever need to do something like
this, definitely use Outsiders as a
reference. I'll see you on the next one.
Peace.

### This AI Knows Exactly What You Need to Train
https://www.youtube.com/watch?v=EC25d2kpSAQ

Hey y'all. What's up?
So, earlier this week I said I was going
to put my entire brain into an AI tool,
and that's exactly what I did. I created
a tool called
uh personalized workout builder.
And this is basically an interactive
um AI tool that is going to help you
build your workouts. So, by the end of
it, you end up getting an 8 to 12-week
training program based on everything
that you want. So, you're basically
going to talk to it like you were
talking to your coach, your trainer,
anybody who would be building workouts
for you.
So, kind of think of it like
you first turn you
first signed up to a personal training
um session,
and you're doing like your intake
session. They are asking you questions
on what your goals are, what you're
looking to get out of the experience,
things like that. And then by the end,
they build your program. So,
I'm going to walk you guys through it.
We're going to build
a workout. I'm literally just going to
freestyle and go off the dome and see
what it gives us.
So, here we go. And if you hop on this
and you want to build one based on your
information, drop it in the comments,
and we can go through it a couple times
with different examples.
All right.
So, it starts off with asking you to
click one of these two buttons. So,
build a workout that fits my schedule or
build my personalized workout program.
They both just
start the system.
So, it says, "Hey, what's up? I'm Keani
from the Workout Creator GPT.
Let's build a workout that fits your
real schedule, not your ideal one. We'll
go step-by-step so you end up with a
program you can stick to. And it asks
you, "What's your goal?" I'm going to
say recomp. That's a common goal that
people have.
It says, "When you say body
recomposition, I'm assuming you want to
build muscle while reducing fat. That's
a very achievable goal with the right
plan." This GPT is not lying.
So, then it asks you,
"Where will you primarily be training?"
I made sure this question is in here
because a lot of times nowadays people
are doing more hybrid style training.
They're doing some days at home where
they only have certain types of
equipment and they're also doing
training at the gym.
So,
um I made sure to have both in there
because it's going to then ask you for
the type of equipment you have in each
setting so that it knows what exercises
you have access to for uh each day.
If you're somebody who only trains at
home, that works perfectly fine, too.
And if you're somebody who works works
out only at the gym, this works as well.
Just be specific. I'm going to say that
I work out at the gym and at home.
I do home workouts and I do
gym workouts.
All right. So, then it asks you, "What
equipment do you have available between
those two places? Be as specific as you
can." Here, you want to make sure that
if you are
listing equipment, make sure you're
you're being specific in terms of how
much weight you have access to,
especially for home stuff. Like, if you
have dumbbells that are ranging from 10
to 30 lb, put that. So, I'm going to say
I have dumbbells up to 50 lb.
At home, dumbbells up to
50 lb. I have a squat rack
and I have a landmine.
At the gym,
I have
everything.
Hack squat, leg press,
hyperextension
machine,
glute
gluteator, I think I spelled that right.
And just put standard gym equipment.
Hey, what's up, Latisse?
Latisse did her workout.
She did her workout yesterday with it.
She got tired talking to me, so she'd
rather talk to a AI.
All right.
So, I gave it all the information that
it needed.
So, now it says it has one more question
for me. And this is the biggest question
and I think it's the most important
question that people typically just
gloss over. They see people training
five or six six or seven days a week
online
and they feel like they have to do that
as well, knowing damn well they cannot
be that consistent. So, when you answer
this question, be brutally honest. If
you know you can only go to the gym 2
days a week,
then put 2 days a week. We're not
talking about what you inspire I mean,
aspire to do. We're talking about what
you can actually do. So, how many days a
week can you realistically commit to
training? I'm going to say
I'm going to say three.
Actually, I'm going to say two because
people think you can get results on a
two-day plan. I'm going to show you how
you can.
All right.
Perfect. So,
it's pretty consistent with how I think.
I was not lying when I said I was
putting my brain into this. I always say
2 days a week is more than enough to
make progress, especially with workout I
mean recomposition, especially if your
workouts are structured well. So, the
best way to do working out 2 days a week
is to do two full body workouts, because
if you're only going 2 days a week,
there's no sense in doing upper body one
day and lower body one day, because
you're not hitting your muscles
frequently, only doing them one time a
week. Once you do upper body, you got to
wait until next week to hit upper body
again. And if you want to recomp or
build muscle, you need more frequency
than that. You need more volume, and
it's it's going to suck to try to
squeeze all of your volume into one day.
So, spreading it across 2 days and
hitting all your muscle groups two times
a week is going to be a lot more
sustainable and a lot more effective.
So, that's basically what the GPT is
going to tell you. So, then
it gives you the sets you're going to
do, and then you're going to choose the
exercises. It's going to prompt you to
choose each exercise with it. So, right
now it's we're starting at with with the
squat movement. So, it's going to go
through picking your squat, your hinge,
your push, your pull. If you don't want
to go through this process, just tell it
to build it for you. Just say, "Hey, I
don't want to do this. Build it for me."
And it'll do that. But, let's just go
through a couple, and then we'll go
through this first one, and then we'll
have it build the second. All right. So,
at home, I have dumbbells up to 50 lb.
So, I'm I'm say
I'm going to do a goblet squat.
Boom.
It inserts goblet squat. Next hinge.
I love RDLs. Let's say I'm going to do a
beast dance
RDL.
It inserts it.
Also, these are just examples or options
that it gives you.
It's built based on every single
exercise I could possibly think of for
each movement pattern. So, if you don't
see a specific exercise here, you can
just type it in and it'll it'll
recognize it and put it in the right
category. So, for example, I don't see
Arnold press here. Arnold press is a
different variation of shoulder press
where you start with your palms forward
and you rotate and press up. So,
we're going to do that one. That's the
push variation that I want to do. So,
I'm going to put Arnold press even
though it's not on the list.
Yep.
All right, pull. Y'all know I'm going to
do pull-ups.
Good. And then for core,
I'm going to do the ab wheel roll-out.
Kind of my favorite core exercise right
now.
Boom. So, that's workout A. Your first
workout is completed. You have
everything you need.
Now, it's going to tell you to build
workout B. I don't want to go through
that entire process of picking each
exercise, so I'm going to have it build
build it for me.
Boom.
So, notice how it does not repeat
exercises. If you gave it a goblet squat
on day one, it's not going to tell you
to do a goblet squat again.
I taught it a very strict rule, no
repetition. We do want
um variety across each workout and you
want to keep those workouts the same for
multiple weeks. So, workout A should
have different patterns than workout B.
So, you'll notice that's reflected in
um whatever program it gives you.
All right, so these are your two workout
programs, I mean, two workout days,
workout A and workout B, and then it
cues you to stay consistent with this
for 8 weeks.
If you have been following me for a long
time,
you know that 8 weeks is still probably
a short period of time to follow a
workout program, but that's the shortest
amount of time that I would recommend.
You can run a program for a whole year
as long as it's working. So, do it for 8
weeks and then, if you have specific
questions on like progressive overload,
how to set up your calories, when it's
time to change exercises, what you
should change it to, how you should
progress, how to progress beyond just
adding weight, then you are going to
grab the Lifter's Blueprint, but this
workout builder gets you like 90% there.
Um
and it gives you a good foundation to
start on. So, if you want the builder,
just comment builder and I will send it
to you so you can start using it today
and you can pretty much always access
the same um template and ask it to make
edits. Just talk to it like you're
talking to a person because that is
literally how I trained it. However, you
would talk to me in the DMs is how you
should talk to this workout builder when
you're using it. So,
if you want the workout builder, you
want to put in your own information and
have it build a program for you, comment
builder
and I will share it with you.
With that being said, I'll catch you
guys later.
Um and I'm going to build some more
workouts with this. Peace.

### ¿Cómo Construí una App de Entrenador Personal con AI Studio en Gohighlevel?
https://www.youtube.com/watch?v=P0UP3L_Sf0c

Hola, soy Marcos. Esto es Metodológico.
Hoy os traigo algo totalmente distinto,
una aplicación que ha creado Román,
nuestro compañero de desarrollo para un
cliente. Es un entrenador personal
impulsado con inteligencia artificial y
creado dentro de AI estudio de Go High
Level, que crea rutinas adaptadas al
usuario y dietas personalizadas e
inteligente con la información que ese
usuario ha introducido a la hora de
registrarse dentro de la aplicación.
tiene rutinas, dietas, lista de la
compra para esa dieta, progresos,
logros, medidas corporales, ranking,
muchísima información y todo totalmente
personalizado a cada usuario. Ahora lo
veremos, es muy interactiva, es
prácticamente como un videojuego y tiene
un asistente 247 que responde cualquier
consulta o duda sobre el entrenamiento o
un ejercicio en concreto. Y le he pedido
a Román que nos haga un vídeo
explicativo de cómo funciona la
aplicación. Vamos a verlo.
Hola, buenas, Marcos. Bueno, esto es lo
que yo he llegado a construir. Lo voy a
sacar en otra ventana para que lo veáis
mejor. Bueno, lo que yo he llegado a
construir ha sido un entrenador personal
impulsado por inteligencia artificial
que te crea rutinas totalmente adaptadas
a ti y dietas totalmente inteligentes
mediante unos datos, un formulario que
rellenas el principio de la aplicación
totalmente personalizado a a ti. También
tienes un asistente que responde las 24
horas del día, los 7 días de la semana
sobre te responde cualquier tipo de
pregunta de duda que tengas sobre cómo
realizar este ejercicio, cualquier duda
que tú puedas llegar a tener.
Vamos bajando por aquí y aquí tenemos
planes y precios que ahora mismo no
están activados, así que podremos elegir
cualquier nombre, cualquier plan que
tengamos. Aquí te va a pedir nombre de
la tarjeta. Aquí tú pones el que sea.
Hm.
Vamos a poner Juan Antonio, no tenemos,
vamos a ponerlo con datos ficticios
porque ahora mismo no está activado.
Procesando plan actualizado.
Bueno, aquí eh cuando os metáis eh os va
a saltar nada más meteros, os va a
saltar esto para rellenar los datos y
que esté totalmente personalizado, pero
a mí no me salta porque ya tengo una
cuenta registrada.
Así que lo primero que vamos a hacer es
vamos a te saldría esto. Vamos a
rellenar aquí con datos totalmente
ficticios aquí simplemente para que
veáis cómo funciona la aplicación por
dentro. Si tienes algún dolor, merita
física, tu objetivo principal, nivel de
experiencia en el gimnasio, en lugar de
entrenamiento, si es en el gimnasio, en
casa, en casa aquí te salca un
desplegable en el que tú puedes elegir
si tienes más materiales que puedas
utilizar
en casa, si quieres añadir más. ¿Cuántos
días puedes entrenar? Si tienes alguna
restricción alimentaria o alimentos que
puedas llegar a evitar porque tienes
alergia o porque no los puedes llegar a
tomar.
Bueno, aquí ya te tira todo totalmente
personalizado. Aquí te tienes un
desplegable que pone mi equipamiento que
puedes agregar más cosas por si te
compras cualquier cosa poder agregarlo.
Luego tienes un un recuadro en el que
tienes un resumen semanal.
Eh, esto es, cabe recalcar que esta
aplicación es muy muy interactiva porque
es todo está diseñado como con un como
si fuera un juego completamente y puedes
interactuar un montón con un montón de
cosas, con personas, con amigos. Bueno,
voy a seguir explicando. Aquí tenemos un
montón de secciones,
eh, las cuales ahora iré explicando una
a una. Bueno, aquí tenemos los martes la
rutina. Eh, podemos ir viendo la
podemos desplegar zancadas con
mancuernas, las podemos desplegar. Vemos
las series que tiene, lo las
repeticiones que hay que hacer, el
descanso, la intensidad con la que la
podemos realizar. Tenemos un vídeo
explicativo
aquí para que puedas ir viendo cómo se
realiza el ejercicio.
Luego, si tú, por ejemplo, vas marcando
porque ya vas terminando los ejercicios
y los marcas todos, rutina completada,
has terminado todos los ejercicios de
hoy. Perfecto. Aquí tienes una guía de
de estiramientos después de entrenar,
según lo que hayas hecho ese día. Por
ejemplo, hemos hecho piernas, pues me da
una rutina de estiramientos para
piernas.
Bueno, luego seguimos con la dieta. Aquí
tenemos, podemos ir marcando, tenemos
una pequeña gráfica en la que nos saldrá
las proteínas que hemos consumido, los
carbohidratos, las grasas. Aquí si damos
receta completa podemos ver los
ingredientes que podemos que tenemos que
utilizar y los pasos para prepararlos.
me da cada día me da una distinta porque
no vamos a comer todos los días lo
mismo. Claramente.
Continuamos. Aquí vemos que ya vamos
sumando puntos dependiendo dice si vamos
eh completando más cosas.
progreso.
Esto es eh como si tuviéramos rangos y
esto se divide, todo se divide en partes
del cuerpo que tú vas a ir
desarrollando. Entonces tú según vas,
por ejemplo, vas progresando
los días de la semana, por ejemplo, una
semana entera ya completa un día de
pierna, pues se te va marcando la pierna
con un uno de estos colores hasta llegar
al final, que es Dios del Hierro, que es
el máximo rango que hay, por así
decirlo. Y si algún día te saltas, por
ejemplo, un día de pierna porque no
puedes ir por cualquier cosa, pues se te
va a quedar en recluta. Y a lo mejor si
esa semana sí lo has completado todo
todos los demás ejercicios se te va
subiendo de rango simplemente. Compra.
Aquí tiene la lista de la compra semanal
para que puedas ir hacer la compra de
para poder completar toda la dieta. Vas
marcando. Todas las cosas están
completas según y medido en la dieta.
Medidas. Esto es para que puedas ir
viendo la evolución física que vas
teniendo a lo largo del tiempo. Puedes
ir rellenando aquí con el peso que vas
teniendo, lo vas guardando, lo que te va
midiendo el brazo. Vamos a poner cosas
ficticias. Y aquí te sale como una
pequeña gráfica para que vayas viendo la
evolución. Esto es el día de hoy para
que vayas viendo la evolución. Esto sale
así con puntos para que veas cómo va
cambiando todo.
Luego tenemos un apartado de galería de
fotos de progreso que es es tú pones una
subes y la puedes comparar con una foto,
por ejemplo, del día anterior, una
[carraspeo] foto de la semana anterior
para que vayas viendo la evolución que
vas teniendo con respecto a otros días.
tenemos un historial que es, por
ejemplo, yo, imagínate que estamos ya el
lunes y quiero ver qué hice, que llegué
a completar el sábado,
pues me meto en el 22, que estaría aquí
en verde, y veo la actividad que he
tenido el el
día 22, las comidas que he completado y
los ejercicios que he realizado.
Nos vamos a logros. En logros tenemos
una serie de logros que son unas
medallas por constancia, que son unas
medallas por completar entrenamiento,
por
otras muchas cosas.
Eh, luego tenemos el ranking,
que es el ranking es que tú puedes
agregar amigos para tener, mira, aquí
tenemos racha, que es los días que
lleváis siendo amigos, que lleváis
conectados, los puntos que lleva la
gente. Mira, yo llevo 100 puntos y el
top un que se llama Ana G lleva 3450
46 días totales lleva.
has desafiado a Naj a superar un
entrenamiento de hoy. Bueno, y aquí para
agregar amigos, simplemente tienes un
código que lo copias
y lo pegas aquí y así añade a más gente,
¿ves? Así vas añadiendo jugadores
y ya está. Simplemente eso. Y hasta aquí
básicamente mi aplicación. Puedes
agregar notificaciones dentro de la
propia aplicación o puedes agregar
notificaciones en tu propio buscador
para que te salte las notificaciones de
qué rutina tienes que hacer hoy. Y pues
esta sería la aplicación completa y
ahora os dejo con Marcos. Y bien, como
vemos, la aplicación es fantástica, no
le falta ningún tipo de detalle ni de
funcionalidad, con lo cual os animo a
utilizar el AI Studio de Go High Level,
puesto que mediante el PR y iterando con
la IA podemos ir creando ya no solo una
simple landing o una página web con un
calendario, un formulario, etcétera,
sino que ya podemos crear también
ciertas aplicaciones con ciertas
funcionalidades más específicas
adaptadas a cada nicho y de esa manera
podemos aportar mayor valor dentro de
ese proyecto para el nicho o el
profesional correspondiente. Así que
hasta aquí este vídeo, espero que haya
sido de utilidad y que sobre todo os
haya gustado, ¿vale? Nos vemos en el
siguiente vídeo. Y esto es todo. Acabas
de ver como hablándole a la IA de Go
High Level se monta un servicio en
minutos. Si quieres hacerlo tú, el paso
principal empieza tu prueba gratuita de
Go High Level con mi enlace en la
descripción. Al registrarte te doy
acceso a metodológico Pro, todos los
recursos, plantillas y sesiones de
acompañamiento para que apliques de
verdad lo que has visto hoy. Soy
afiliado y gano una pequeña comisión si
te registras con mi enlace y sin ningún
coste extra para ti. ¿Todavía no lo
tienes claro? Entra en metodológico
Free, ahí te explico qué es Go High
Level, para quién es y resuelvo todas
tus dudas antes de dar el siguiente
paso. Nos vemos dentro y si este vídeo
te ha servido, suscríbete para no
perderte ninguna de las próximas
novedades de Go High Level. Nos vemos en
el siguiente.

## General

### Anthropic Just Dropped the Biggest Claude Code Update Yet
https://www.youtube.com/watch?v=B-YQANvDOq0

Okay, so earlier today Anthropic released what 
I consider to be the best feature in Claude Code  
yet, function hooks. So before then, I really 
liked dynamic workflows, but after trying out  
function hooks for the last few hours, I was like, 
wow, this is really powerful. I gotta make a video  
about this. Now I'll be going over everything 
to do with this feature and how we can use it  
to be even better engineers. But first of all, 
if you don't know what normal hooks in Claude  
Code already are, then I do have a free video 
about this on my blog linked down below. Where  
I basically give some motivation for why hooks 
in Claude Code are handy and why you may want  
to use them. Now function hooks basically take 
hooks to the next level and make Claude Code  
even more hackable and customizable. And they 
solve some of the existing issues with hooks  
in Claude Code. Okay, so very quickly, there is 
a sale going on right now for my Agentic Coding  
School. More on that later in the video. Now to 
quickly make sure we're all on the same page,  
if you already know this stuff, then you can skip 
1 or 2 minutes ahead. The reason why we use hooks  
is to basically add deterministic control to 
Claude Code. So one of the problems can be that  
in your Claude MD file, you may define a rule such 
as never run destructive Supabase commands. And  
then as your context store is filling up, the 
rules at the beginning in your Claude MD file  
and your system prompt can fade over time and 
Claude may forget to apply those rules. Or you  
may get a bit sloppy in your prompting and you 
may give a lazy prompt, Claude misinterprets it  
and then runs a dangerous action. Or you may have 
defined a workflow that Claude is not following  
properly. All of these can be solved by adding 
deterministic hooks. So as a really brief example,  
you can basically tell Claude, make me a hook that 
will block dangerous Supabase commands when using  
the Supabase CLI. And then it will do something 
kind of like this. So for example, in this case,  
before it runs a Bash tool, then it will run this 
script over here, which refers to this Bash script  
called supabase-guard, which will basically block 
any commands such as deleting a Supabase project.  
So I can see some of the commands that are 
blocked over here, deleting projects, branches,  
and stuff like that. But existing hooks have a 
few limitations. So they can't rewrite anything  
such as a prompt that you may have given. 
They can't append any extra context to it  
from a company knowledge base, for example. 
They can't draw buttons or a status line and  
rows and stuff on Claude Code. They can't ask 
user questions. They can't add tools or edit tool  
descriptions. And there is no memory with existing 
shell hooks. So you can't remember things across  
different hooks and sessions. Whereas function 
hooks basically solve all of these issues. And  
the way that I like to think about this is 
it's kind of like middleware that you would  
come across in Express.js. So if you have used 
Express.js middleware before, then this should  
look very familiar. Here we're basically blocking 
anyone who doesn't have an authorization header.  
And if they do, then we allow them to proceed 
to next. Whereas for function hooks, it looks  
kind of like this. So on any tool call inside of 
Claude Code, we can match it to a certain tool,  
such as the Bash command. And if it matches 
a certain regex, such as deleting a folder,  
then we can block the command. Otherwise we can 
let it proceed. And this means that we can do  
pretty interesting stuff inside of Claude Code, 
kind of like this. So you can see in this case,  
on any tool call that Claude Code does with 
the Bash tool, we basically replace npm in the  
command with pnpm install instead to prevent it 
from doing something such as accidentally using  
npm on our codebases. So here we are basically 
rewriting the input. We can also do something like  
short-circuiting. With Claude Code function hooks 
now come with a store. So for example, over here,  
if Claude Code were to do a web fetch, then it 
would first look in the store inside of Claude  
Code to see if that URL has already been fetched 
before. And if it has, then we can just return  
the cached copy instead. And if it hasn't, then we 
can just let it proceed. Now another pretty neat  
example is I can override any default tools inside 
of Claude Code. So for example, Claude Code has a  
web search tool, and I don't think it's very good 
because I use Brave Search behind the scenes. So I  
prefer using the Exa MCP server instead. One of 
the problems can be that Claude Code will still  
end up using the web search tool, even though 
I told it to use an Exa MCP. So what I can do  
instead is I can override the web search tool 
by middlewareing it, whereby it will intercept  
the tool, see if I have an Exa API key set. If I 
don't, it will default to the normal web search  
tool. If I do, then it will send a request to the 
Exa API endpoint to get the search results. If it  
failed for whatever reason, then it will default 
to web search tool. But if it was successful,  
then it will return all the results back into the 
main session. So that means I can uninstall the  
Exa MCP and still have Exa used in the background 
by intercepting the web search tool. Claude Code  
also has a web fetch tool, which sometimes ends 
up getting blocked. So you could change this web  
fetch tool so it routes via a proxy that you have 
yourself. And that's why I like the analogy of  
function hooks being Express.js middleware. Now 
we have a whole bunch of building blocks when it  
comes to function hooks in Claude Code, as well 
as my favorite, which is making changes to UI to  
make it more customizable for your workflows. Now 
let's go for a couple examples. We'll start off  
with really basic ones and then move on to more 
complicated ones. Now you may be in a situation  
where Claude Code accidentally loaded in a secret 
into your session transcript by running some kind  
of Bash command, and it's now like, oh no, the 
secrets are now in the session transcript. You  
should have to delete the session transcript 
or rotate them. And the same thing can also  
apply to emails and like IP addresses or any 
kind of sensitive data. So we can use what is  
essentially middleware to intercept the input 
into Claude Code and then redact these secrets  
before passing the message into the session 
itself. And the way we can do this is by first  
enabling function hooks by running this command, 
CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1 claude,  
press enter. And now we'll get access to a brand 
new built-in skill, which is plugin-authoring. So  
it says over here, Write or debug a Claude Code 
plugin made of function hooks. So pressing enter,  
I can basically say something like, hey, can you 
make me a function hook that will basically block  
any secrets from entering the session transcript 
by measuring the entropy and also make another one  
to block emails and anything that looks like an 
IP address. Pressing enter, it will basically go  
ahead and make that function hook for us. Okay, 
so now it's built out the functional hook and  
I'm really surprised because it went the extra 
mile and did something really clever. That I  
will explain in just a second. But if I go over to 
the project now, I can see in the .claude folder,  
I have plugins.json, transcript_redactor.json, 
hooks.json, and then redact.ts. So this is the  
hook that it designed over here, about 300 lines. 
And it defined a really interesting in-memory  
store at the very top that allows it to use 
secrets without actually seeing the secret. So now  
I'm going to try it out by giving it an Anthropic 
API key. So pasting that in over here. I'll say,  
can you make an API request to Sonnet 5 and ask 
it for a short story? Pressing enter over here,  
you will see it was automatically redacted, 
the secret, as soon as I pressed enter,  
and it got replaced with an ID. Now this secret 
is now stored in memory in the line that I  
just showed before. And now when Claude makes a 
request, a Claude request, then it actually uses a  
secret right over here, the ID of the secret, not 
the secret itself. And when this request is made,  
then the hook automatically rewrites it to the 
correct secret. So you can see it successfully  
made the request and got a short story back, which 
is really good. So using function hooks, we added  
security by never allowing secrets to enter the 
transcript. And secondly, allowing it to actually  
use secrets that we give it to make requests 
on our behalf. And the store that I used over  
here was essentially the variable store where the 
next hook and the next turn can see the variable  
that was defined. If you want a store that will 
persist across different sessions and restarts,  
you can tell it to use this store instead, 
which you may want to do for something else,  
ideally not secrets. And this is really similar 
to Agent Proxy by Infisical, whereby we have  
a proxy that intercepts each request and adds a 
secret as that agent is making the request. Okay,  
so one of my favorite parts is this new UI thing 
where we can get a function hook to customize a UI  
of Claude Code. For example, every time you push 
to main or merge into main and it's deploying on  
Vercel or something, you can have it automatically 
show you the deployment status in a brand new row.  
And that row will only appear when this hook 
is triggered. So let's actually design that  
over here. So I'm going to do /plugin-authoring 
again and say, can you make me a hook that will  
basically show me next to the prompt status 
bar, the current Vercel deploy and the stage  
that it's on and how long it's been building for. 
And once the deploy is complete for the next hour,  
keep that on the like bottom. And as we add new 
deploys, then that should like pile up. Feel free  
to interview me, give me a bunch of prototypes I 
can play with before finally coding this up. So  
I can describe a function hook kind of like this. 
And there are enough primitives that most of what  
you want to do should be possible. So it's now 
asking me a few questions of how it should look  
like over here. So I'll basically answer them and 
then build it out. So now it's built it out over  
here and called it Vercel deploy status. So let's 
go ahead and do a Vercel deploy. So I'm basically  
going to say, Can you enable the sale banner and 
then merge into main and deploy? Pressing enter,  
it will turn on the sale for the website. So 
now I can see something really cool here. So  
it says queued, building, ready. And it basically 
shows me the stage that it's at and how long it's  
been working there for. And I can also press 
this button over here that will basically allow  
me to hide this and then also reshow it. So each 
function hook, which we define inside of a plugin,  
we now have a panel where we can view data 
live. So I can see it's now ready and it took  
5 minutes and 50 seconds. So if I go back to 
the website and then refresh the page, I can  
see that the sale banner for the lifetime deal 
is now on. So basically at the end of next week,  
I will be removing the lifetime plan from the 
website and every class and future class will end  
up being sold separately instead. So if you want 
access to every class and future class I release  
inside of one purchase, then you have about a 
week left to buy. Over the last 9 months since  
I released this, thousands of engineers have taken 
this many of your favorite engineers from some of  
the world's biggest companies. And over those 9 
months, I've updated the class about 250 times  
to make sure that it's relevant and current. And 
many of the techniques that you find taught here,  
you will not find anywhere else online. And 
going forwards, I will be switching over to  
a cohort-based model. So about 3 or 4 times a 
year, I will be running an AI software development  
lifecycle cohort where I will be going through 
all the new alpha when it comes to shipping and  
maintaining production-grade software. With 
AI coding agents. You can already see many of  
the applications I ship and maintain. They are 
down below in the description. But essentially  
going forwards, I will be focusing less on the 
tools themselves and more about the AI software  
development lifecycle. So there will be about 25 
hours worth of content alongside the live Q&A,  
which you can come to. And because it will have a 
live component as well, the price will be high for  
this. So by signing up to a lifetime deal now, you 
will get access to every future cohort that I run.  
But if you miss a lifetime deal, then you will 
have to sign up to each cohort separately whenever  
it runs. Now the first cohort will be running 
from like late September, early October time. I  
still have to finalize the dates, but it will be 
going through the entire AI software development  
lifecycle when it comes to using AI coding agents. 
A lot of people have been telling me recently,  
"Ray, you should really raise your prices. People 
charge 3, 4, 5 times as much as you and they give  
1/10th the amount of value." So I think I should 
probably raise my prices to be in line with the  
market. Which makes the current lifetime deal an 
even better offer. A lot of the content in the  
upcoming cohort will be cutting-edge content that 
you will find almost no one else teaching online.  
There is a 30-day money-back guarantee if you 
don't find yourself happy for whatever reason,  
but so far less than 0.2% of people have asked for 
their money back. And that's basically how I know  
my classes are good. So yeah, links to everything 
will be down below. And also, by the way,  
I will be releasing my dedicated agent sandboxing 
infrastructure very soon. So if you do want access  
to the most cost-effective agent sandboxes on the 
market, and then this is a place to find them. But  
also, if you do want early access as well, then 
you can go on the website and fill out the form  
down below. Now, some more function hooks that 
you may want to make is you may want to make  
one that is for dry runs. So if you do any kind of 
data analysis, you may first want to go for a dry  
run before the real analysis actually happens. So 
we can basically block any real commands running  
until the dry run command has run to show you what 
the output would look like. We may also want to  
combine this with the previous UI thing, So in 
big red characters, it would say something like,  
hey, you're running in production, or hey, you're 
running in dry mode. And this works really well  
with the ask function as well. Another way of 
using the ask function is basically I can tell  
Claude Code every time it comes across and 
edits a file that goes beyond 1,000 lines,  
then it automatically asks me, hey, do you want to 
refactor this file to basically split it up into  
smaller files instead? And this can be really 
effective for making sure Claude Code doesn't  
add really massive long files like 2,000, 3,000 
line long files because for some reason models  
still like doing that. And to basically do that, 
I can run Claude Code with enable function hook,  
do /plugin-authoring, and then say, can you make 
me a function hook that will basically ask me  
every time a file that you're editing whether the 
file should be refactored to make it smaller into  
many smaller files instead. So saying something 
along those lines, it will basically come up with  
that kind of function hook for us. We also 
have two interesting ones over here. Where  
we can have a hook automatically call a model 
and we can also have it speak to us using the  
built-in text-to-speech that we have inside 
of our computer. Can you make me a hook that  
will basically speak every time a turn ends, but 
first pass it to a Haiku model to give a summary  
of everything that was done? So if I give a prompt 
kind of like this, then it will make that function  
hook for us as well. So whilst we're waiting for 
those two to complete, I can use other primitives  
such as registering a brand new tool or calling 
an existing tool. I have a clock that I can use to  
measure how much time has taken between different 
turns. So I can combine many hooks together to  
basically see like, okay, if a turn has taken 
longer than 10 minutes, should we save the result  
to a separate file so we don't lose that result? 
If you're working in an industry with a lot of  
compliance like healthcare or payments, then you 
may want to set up a hook very similar to this,  
whereby on every single event that Claude Code 
runs, it automatically sends all the results  
over to your own log store that you may have for 
your organization. So you have an audit trail or  
what exactly Claude Code is doing. As for a 
non-technical example, let's say that you use  
Claude Code to draft and send email newsletters. 
You may want to prevent it from automatically  
sending the email newsletter until it has used 
the ask user question tool to verify that you  
actually want it sent, and until it made sure that 
you spent enough time actually reading through  
the newsletter as well. So this can prevent you 
from doing like an accidental send, for example.  
Essentially, function hooks are now a really 
powerful primitive inside of Claude Code, which  
is why it's now my favorite feature, because now 
we can customize and hack Claude Code in all sorts  
of different ways. And you can also just tell like 
/plugin-authoring, point out your Claude.md files  
and be like, okay, which hooks can we make here 
to ensure we have more reliable deterministic  
behavior going forwards? So all the things that 
you may have been putting in your Claude.md files,  
you can start removing and putting into really 
well-defined hooks.json instead. And because  
function hooks do exist as plugins, you can simply 
share them with the rest of the team. Via some  
kind of like shared GitHub repo. And speaking of 
teams, if you do want training for your entire  
team or your organization personally from me, 
then there is a form down below that you can  
fill in. A lot of companies have been requesting 
this from me recently to basically bring all their  
engineers up to speed and to find Claude Code and 
Codex workflows that work really well for their  
organization. And now it seems Claude Code can now 
speak to us. So if I do /reload plugins, then it  
will reload that particular function hook that it 
made for us. And then if I say, hello testing 123,  
press enter. The assistant explained that a plugin 
loaded and a count increased from 9 to 10. And you  
can see now it works properly because it used the 
default Apple voice to narrate what happened. And  
I can see that right over here inside of the UI. 
So if I look inside of this function hook over  
here, I can see that it made a small persistent 
prompt, which goes over to the Haiku model. And  
this is a system prompt that I wrote, and this is 
using the $model command over here. So I can see  
it's calling this model and then it finally speaks 
it out. Now I really like the $model because we  
can do some really interesting stuff. For example, 
whatever the user prompt is, we can automatically  
generate a few keywords and then use like $http to 
query our company knowledge base in a secure way  
to automatically get any additional context from 
it to inject into a session. So that Claude Code  
does a better job. Or you can do something kind of 
like using this alongside the UI ask, whereby when  
it comes to opening up a brand new PR, Claude Code 
will generate a quiz for you to make sure that you  
correctly understand the changes that it made 
before it actually allows you to open up a PR.  
So yeah, this is why it's my favorite feature 
in Claude Code. There are literally hundreds  
of examples I can think of, and I'll probably be 
adding a whole bunch to all my different projects  
to enforce standards, workflows, and a bunch more 
things. And I will be talking about this in even  
more detail inside of my Agentic Coding School and 
any future cohorts that I run as well, and in my  
live Q&A as well. So if you do want to get in on 
the lifetime deal to get access to every future  
class and cohort for one price, then now is the 
time to do so. And that will give you access to  
my very first cohort beginning in late September, 
early October, and every future cohort that I run.

### Garmin Cirqa Ultimate Accuracy Review (vs Whoop, Fitbit, Amazfit)
https://www.youtube.com/watch?v=2K4x0CnuQug

So today I have a complete Garmin Circa
deep dive, but more than just Garmin
Circa. Also comparing it to the Whoop
5.0 strap, the Fitbit Air. I've got up
here, the Amaze Fit Helio, the Polar
Loop, and plenty more. And more than
just the Circa wristband, but also the
Circa Bicep Band. And of course
comparing this all to heart rate straps,
as well as other data sources. In this
video, I'm going to dive through a bunch
of different categories, including the
accuracy of heart rate data while
working out, both for myself as well as
my wife. And in doing so, in many
different workout types, running and
cycling and strength workouts, you name
it. All to talk about where this works
well and where it falls short. One quick
note, this video is sponsored by
Precision Fuel and Hydration. More about
them later on in the video. Except
here's the thing. There's more than just
accuracy of heart rate data. I'm also
going to dive into sleep data. I'm going
to dive into step data. I'm dive into
calorie data. I'm gonna dive into
automatic exercise recognition and how
accurate that is because at the end of
the day, I'm gonna tell you a bit of a
secret here. It is not about sport heart
rate accuracy that's going to matter the
most in most of these wearable devices.
Instead, it's going to be about how
accurate it detects when that activity
starts when it's doing that
automatically. That is actually the most
important thing and even far more
important on Circa for reasons I'll get
into in just a moment. From a device
standpoint, I've got basically seven
wearable devices I am wearing at once.
Uh the first one is the Circa on the
wristband right here. The second one is
Circa on the bicep or armband as Garmin
calls it. On the other side, I have two
more devices here. I have the Whoop 5.0
band and the Fitbit Air Band. Now,
normally I would not recommend wearing
watches side by side like this. And the
reason is watches, the cases themselves
will bang together like this, even when
they're very, very close. That will trip
up both heart rate as well as step data.
But for these super lightweight fabric
bands, they don't move at all. In fact,
I've been testing this scenario here for
three months, both single wristed,
double wristed. It's made no difference
whatsoever, as you'll see in these
accuracy results as well. Next up on the
bicep right here, I have the Maze Feelio
as well as the Polar Loop. Now, one
important thing to know about any
wearable that you put in your bicep,
it's going to do better. Like, just
factually speaking, if you're comparing
a wearable up here to a wearable down
here, this is going to do better every
single time when it comes to workout
data. Inversely, however, when it comes
to sleep data, the wrist is a better
location. Again, I'll dive into why and
show you why in just a moment. That
said, I do want to clarify these two are
in different spots, thus expect
different results. I've only got so many
wrists and only so many places to put
things. So, that's just the way that
cookie crumbles. Next, from a heart rate
strap standpoint, I'm using both a
Garmin HM600, their latest heart rate
strap, as well as a Polar H9 heart rate
strap. I've been using these straps for
a year in the case of Garmin and many
many years in the case of Polar and all
of them are perfectly accurate for
capturing heart rate data during
workouts. And then finally, as you can
see, my wife right here, she has Circa
on one side and then a Garmin Fenix 8
43mm watch on the other side. That's
notable because that has Garmin's Gen 5
optical heart rate sensor versus Circa
has Garmin's Gen 4 optical heart rate
sensor. She's also wearing a chest
strap, sometimes Polar, sometimes
Garmin, with each one of those data
sets. And hey, a quick note here. But if
you are find this video interesting
useful, just simply watch it all the way
through. That is the only thing the
YouTube gods care about, and we got to
keep the YouTube gods happy. Okay, so
with all that basics out of the way,
let's dive straight into the workout
heart rate accuracy. Oh, one quick note.
I'm in my father-in-law's garage shed
cuz I'm traveling these couple weeks,
which is why it looks a little bit
different. I'm also sitting on a
shopvac. So, for workout heart rate
accuracy, we're going to start off with
an indoor trainer ride. These are one of
the easiest things for optical heart
rate sensors or all heart rate sensors
to get right. And as you can see here,
it's spot-on. There's really no
differences amongst all the different
wearables. It is good across the board.
From there, heading outdoors into a
roughly two hour 40 minutee long bike
ride into the mountains road bike ride.
It was a very, very hot day out this
day. Unfortunately, my wife did not yet
have her circa wristband. So, just me
with mine. But, as you can see here,
spot-on across the board. No issues with
this circa data set. Very, very good
across the board on this warm day. It
was about 95° Fahrenheit, 35° C. So
definitely pretty toasty mid-after
afternoon sun. And the reason why I note
those temperatures is super important. I
then flew from Spain where I live to
Newfoundland where my wife grew up. And
here it is not terribly warm and sunny
out. And as you can see on this gravel
ride here about 3 hours roughly the
first and last hours were road and the
middle hour there was gravel. And you
can see it really struggles in this. And
it struggles in a kind of bunch of
different areas. Uh, by the same token,
all the other wristbased wearables do
because in colder temperatures,
wristbased wearables especially do tend
to struggle versus the bicep versions of
both of these had no problems whatsoever
on this route. However, a little bit
less miserable day, my wife and I went
back out again. And actually, here is
her data on this one. And what's
fascinating about this is it's comparing
the Fenix 8 43mm on one side to Circa on
the other side and then a chest strap.
And you can see Circa nails this across
the entire board. Like super well done
to this day. probably not having the
additional rain and some of the
additional wind probably helped a little
bit and keep things a little bit warmer
in the wrist there. And here's the real
kicker. If you look at this one section
that I've highlighted, that section is
like a really chunky gravel, basically a
mountain bike section that we went on.
In that section, Circa actually beat the
Phoenix 8 despite the Fenix 8 having Gen
5 and Circa having Gen 4. And the reason
is probably pretty obvious. A Fenix 8 is
heavier and it's going to bounce around
a little bit more on that bouncy terrain
than Circa would because it's quite a
bit lighter. the same truths and that's
been the case for many many years on
watches where heavier watches tend to do
worse than lighter watches. It also
demonstrates that even on cooler days,
it can go ahead and get pretty good at
heart rate while cycling. And the reason
it's so important to bring up
temperatures is that I've seen some
people compare accuracy charts where
they take winter data, they take summer
data, and they put it on one single
chart like giving a score to every
wearable. That's wonky. Any company will
tell you that winter data will always be
worse for riskbased wearable than summer
data. So, you shouldn't put those on the
same chart. You should instead compare
devices on the exact same day, the exact
same time. And that's how you judge
whether or not a device was accurate on
that given day and time. Now, next up,
we've got a run, relatively steady state
run here. It's flawless. No problem at
all. All the devices were flawless. All
was good. However, 2 days later, I went
out again for an interval run here. You
can see these basically 8x 400 meter
rebeats and the circa wrist one
completely fell apart. You can see this
here. It is missing almost every
interval. got like one interval correct.
The kicker though is it actually got the
warm up correct. It got the cool down
correct. It was just the interval, these
hard start intervals that it missed
essentially every single time. You're
seeing the exact loop I did right here
on the side. Nothing crazy about this
crush gravel kind of a trail path just
over and over and over again. Uh the
bicep band did perfectly fine of course,
but the wristbace circa did not. Now
wondering about this, I went out again
the next day. I thought maybe it was
just a bit too cold or windy or rainy or
whatever it was miserleness that day and
tried it again. This time a fine by
repeat and it's exactly the same. It
failed yet again. So thinking that maybe
it was just like the device, maybe these
need to be switched. Maybe I had a bad
pod. So I swapped these devices. I put
the one I had my bicep down my wrist and
vice versa. Went out again today for now
the third time of 400s and again the
wristbase one crapped itself. So that
wasn't the case there. Thinking it was
perhaps me that was the issue, I said,
"You know what? I'm going to call my
friend and make him suffer, too." So, I
called up Dez of Desfit, sent him out to
run a bunch of intervals and suffer. And
he went out and suffered, and his was
perfectly fine, as you see right there.
One slight bobble midway through on one
of those, but no problems at all. So,
that means it's definitely some portion
of me for this particular route. And
that's one of the tricky parts of
accuracy testing. In this case, my guess
is going to be either the temperature.
Desa's temperature was almost 90°
Fahrenheit. So way way higher than my
60° Fahrenheit. I was on crush gravel.
He was on pavement. Our speeds are going
to be different. All those things could
be a factor. Maybe if I had another
month worth of running data, I'd be able
to figure out, hey, it's these 400s that
cause it but not the 800s, the 1200s, or
maybe it's this temperature, or maybe
this terrain. I don't really know. I
didn't have that extra time, and neither
do you to figure this out. So these the
results are what they are. Now, one
thing I do have though is position fuel
and hydration products on all my runs
and rides. You can see that right here
with Precision's new watermelon shoes.
Those are pretty awesome. In fact, we've
been using those the last couple weeks
here. As well as, of course, Precision
Fuel and Hydration gels I've been using
for many, many years. But not just
myself and my wife, but pro teams like
the NFL, the NBA, Pro Cycling, a Tour to
France teams, and both the men's and the
women's side, and plenty more. One of
the things I love about Precision Fuel
and Hydration, though, is more than just
the products themselves, which are
totally fine to consume, even when I'm
like 14 to 17 hours into a hike or some
sort of trail run for that particular
day. but also the fact that they have
sport scientists on staff that you can
have a Zoom call for free to talk
through your particular racing or
training need. They'll help you figure
out the right nutrition products and
strategy for that particular race. And
again, it's totally free. Now, all their
products are in form sport certified,
all are vegan, all are 2 to1 glucose
fructose and contain no artificial
ingredients. And most importantly, they
are completely edible after many, many
hours in a saddle or running or whatever
adventure it is that you may be. You can
save 15% off your first order by using
the coupon code in the screen right
there. Thanks again to Precision Fuel
and Hydration for sponsoring this video.
Now, one more accuracy section I want to
dive into from a heart rate workout
standpoint is strength training. In this
case, Dez, my friend Dez Desfitit, you
can find his YouTube channel and his
circa content linked down below
somewhere here, uh, went out and did a
bunch of different strength training
workouts, many, many workouts in fact,
uh, using both the armband as well as
the wristband. Uh, he also compared it
to a bunch of different devices. He sent
me over a few of these data sets to
include in this larger set of things.
The first one right here is this workout
where it starts with two sets of lat
pull downs. And you can see the circa
initially struggles at the very
beginning before settling down. From
there, he goes into shoulder presses,
seated row, lateral raises, and then
even more rowing. And you can see in
most cases once he got past that initial
bit there, circle was largely fine,
minus those early errors. The Fitbit did
struggle a little bit briefly in there
as well. Here's another strength set
from him. In this case, starting off
with bench press for the first two
orange dots that you see right there.
And then after that we have arm curls
and then shoulder press and then ending
with a row. You can see again starting
off the very beginning the first 2
minutes circa on the wrist kind of
bobbles the ball a little bit and then
it settles down and is largely fine. One
brief moment for a few seconds around
the 28 minute marker but beyond that it
was pretty good overall. And looking at
all of his data sets that was kind of
the general trend. It seemed like the
first couple minutes the wristbased
circa these are all manual uh detections
basically like we're a bit slow to get
locked but after that it was perfectly
fine. The other thing to keep in mind
here is you look at the actual heart
rates themselves we're talking between
100 110 beats per minute which is super
low in the grand scheme of heart rates
compared to like a running interval
workout or a cycling workout. In the
case of Garmin in particular, it's not
going to have much of a difference, if
any difference whatsoever, on the actual
training load or even calories at the
end of the day. Versus if you had
something like we saw on the running
side where it was missing it from what
should have been 175 down to, you know,
130, that kind of range, that is a huge
impact on training load as well as a
huge impact on calories and all the
other metrics behind the scene. The
point being outside of those minor
errors briefly for a few moments either
on wrist and then very more rarely on
the bicep, it was pretty good overall
and generally in the same ballpark as
all the other devices whether they're
worn wrist or bicep. But here's the most
important thing to understand about
Circa. It's not workout heart rate that
matters. Instead, it is the automatic
detection of those workouts that
matters. Now, I'm going to dive into
more of this in my full in-depth review
coming up in the next day or two, but I
will dive into the accuracy piece of the
automatic detection. By that I mean that
with a screenless wearable like this you
have two basic options. The first one is
you can use your phone to manually start
something as well as use the button on
the side of Circa which is unique to
Circa. The second option is to use
automatic detection, which means you
just go out of the garage, start
running, and then hopefully within a
very short time period, maybe 20, 30
seconds or a minute at worst, it figures
out you're running or riding or whatever
it may be, and detects that workout and
starts to increase the optical heart
rate sensor power to give it higher
fidelity workout data. In the case of
Garmin, they only collect that higher
fidelity workout data during a workout.
versus Whoop and Fitbit, they're not
only logging that data 24 by7 to higher
fidelity, they're assigning your
training load, in the case cardio load
for Fitbit or strain for Whoop, based on
the entirety of the day. Whereas Garmin
is only assigning training load based on
defined workout periods. And with
Garmin's case, this is the most
important part here. If it ends what it
thinks is that workout in automatic
detection, let's say it thinks the
workout's 45 minutes, in reality it's 60
minutes, then you lose that heart rate
data for the last 15 minutes and there's
no getting that back. So, this is why
automatic detection is one of the most
important things, if not the most
important thing on this device. Because
if it can't automatically detect it and
you didn't do it manually, then the
actual accuracy, the heart rate doesn't
matter. So, with that explainer out of
the way, I'm going to quickly run
through a slate of different workouts
I've done on auto mode and talk about
whether or not it caught it. First up is
a whole boatload of bike commutes that
I've done, uh, both on a regular ebike
as well as a cargo ebike and other bikes
in between. And by and large, it's
missing the vast majority of those
workouts. Only a few of them were
actually automatic detected versus they
were all detected by Whoop and Fitbit,
but not so much my Garmin. Now, to
Garmin's credit, they have made a
boatload of changes in automatic
detection in the last 2 weeks alone,
even without updating the firmware for
Circa. That's because mostly automatic
detection happens after the fact, and it
happens on the phone in the Garmin
Connect app, as well as some back-end
platform stuff. And I've seen those
changes improving things in most of my
bike commutes. We're on the earlier side
of things. But hey, that's what they
launched to production with. And that's
the data I have for right now. Next up,
a road bike ride of the mountain. In
this case, it automatically detected the
start of that basically perfectly and
engaged the GPS. One of the cool things
that Circuit will do. It'll turn on the
GPS on your phone if you have that
configured that way. So, it gives a
track that you can upload to Strava or
just even shows in the Garmin Connect
afterwards. The problem is when we
reached the top of the mountain climb
and started coming back down again, a
descent of like I don't know 15 20
minutes or so, it stopped that activity
at the top. Even though once we got down
that initial descent, I then had more
climbing and more flats to do, including
some pretty high heart rate sections
that it missed entirely. You can see
right here how it basically just ends
that recording right there. And then you
lose the heart rate data for the rest of
it. Now, Aldi, for this single activity,
like 5 hours later, the heart rate
magically showed up, which is kind of
strange. Garmin doesn't have an
explanation for that either. They agree
it shouldn't have ended at the top of
the climb, but that is what it is. Next
up, some running intervals. In this
case, it was really good on these. Now,
the one caveat, and most of them did
kind of the same thing, is Garmin would
tend to pull in more of my walking
portion to the start of the run. I
usually start my runs like 4 to 5
minutes away from my house or whatnot,
and I'm just simply walking casually
there, then I start running. In the case
of Garmin, it includes that walking
portion at the beginning of the workout,
but it also allows you to very easily
just trim off that front end and you're
good to go. I see the same in other
devices as well. But again, overall,
from a running standpoint, it was
spot-on. Next up was a gravel bike ride
I did about 2 hours or so. This was
really, really good. It basically caught
the start of that ride within like 30
seconds. Not even 30 seconds, like
before I even got out of the parking
lot, basically. And then we finished up
back on that same launch. It basically
stopped within a minute or two. like
really really good job on that one.
Notably, that was later in the last 2
weeks and earlier where you're seeing
some of these auto tech changes taking
place behind the scenes from Garmin
standpoint. Next up is indoor trainer I
did right behind the camera. Uh in this
case, it started about 6 minutes later
or so during this really gradual uh
buildup of a warm-up there. So, kind of
really easy and then once it caught in,
it was good for the rest of it and then
it ended within like 30 seconds of me
getting off the bike. This is one of
those activities where just it's so
gradual at the beginning that it's hard
to detect. Again, this is the reason why
Garmin says you have this button if you
want to use it or the manual workout
option. That's ideal for things that
start easier, maybe stay easy. That
could be yoga, strength workouts, etc.,
where from a heart rate standpoint, it's
not going to escalate super high. And
you want that data from the very
beginning. Next, my wife and I did a
1-hour walk, just not like a super brisk
walk, just a medium paced walk out at
night here. In this case, it took about
4 minutes from when I started the walk
to when it started the walk. Uh, but
there was some frogger we had to play
across the street or busy intersection
of sorts. Uh so that might have
contributed to that slight delay there.
And at the end within 60 seconds it
concluded that particular walk. So good
job there. Uh looking at strength
training sessions and talking to Dez
Deset mentioned earlier on he did a
bunch of testing with automatic workout
and it didn't detect a single one ever.
Uh the Fitbit did detect every single
one without an issue. Uh but in the case
of Circa it missed it whether it was on
the wrist or on the bicep. Uh that said
for other nonofficial strength things
that I've done. I was moving house a
bunch in the last week prior to this
carrying a crapload of heavy boxes back
and forth for hours and hours on end and
super hot 90 plus degree temperatures
and it detected large swats of that is
strength training. So good job there. I
guess it's detecting that activity in
the same way Fitbit or Whoop would uh
but it wasn't always detecting strength
workouts for Dez. So that's something to
keep in mind. Ultimately come to the
automatic detection of activities. I
would rank Whoop the highest followed
just very closely behind by Fitbit. Then
Garmin kind of is good but getting
better. And then there's a maze fit
which like detects things really really
quickly but then also ends things really
quickly. There was numerous times during
my interval workouts with just a 90
second recovery period where the maze
would be like nope you're done workout
complete and you'd see it like trip and
go ahead and start again and kind of a
mess and then polar
[sighs]
yeah polar. So let's talk about sleep
data. Now next when it comes to accuracy
sleep data I'm going to focus on four
basic things. The first is what time did
I go to sleep, what time did I wake up,
and then the duration with that. Uh, so
those are like the most important things
when it comes to sleep. Next, I'm going
to look at heart rate variability and
how that trends over the course of the
night. And then third and fourth, for
fun, I'm going to show you the sleep
scores and the breathing rates. Uh,
sleep scores are all different by
company, so you really can't compare
them, but it's good just to like give a
general swag of how different those are.
Now, one thing I will not be doing is
showing you sleep stage comparisons.
That'd be things like REM sleep, deep
sleep, awake, etc. And the reason is the
tools to do that are simply not that
accurate. They are in a best case, an
absolute best case mid 80 percentile
range, which we would never compare
things to a heart rate strap if they
were wrong 20% of the time. That'd be
crazy. Like I don't know why we're doing
that. I know some people do, but at the
end of the day, it is not accurate and
it's not really all that useful. The
most important thing is your total time.
And did it get the time I went to sleep
and the time I woke up correct? So
that's what I'm going to focus on
talking hundreds and hundreds of data
points. From there, we'll start off with
the sleep times. You can see these right
here. The general trend here is for the
most part, Circa tends to get it right
on the wrist most of the time within 5
minutes. And most of these companies are
within 5 to 10 minutes across the board.
So good job there. There was a few times
though where Circa definitely thought I
was asleep well before I was upwards of
a half an hour or so than I actually
was. And this would be cases where I was
on my phone in bed or reading or
something like that and it just simply
thought I was asleep. Still, if I look
at these across the board, they're all
kind of a wash. You can pick out days
where one was better than the other. But
having worn the Whoop for like six years
now, and having worn all the different
devices for the full duration since the
day they were out, I can tell you that
on the whole, it's kind of a wash for
me, at least from my data, they're all
basically going to get things wrong
every once in a while and get things
right the vast majority of the time in
terms of the time I went to sleep and
the time I woke up, which what you're
seeing right here. In general, it tends
to get the time I woke up like almost
perfect every single time because
usually I'm getting out of bed and going
somewhere versus I go to sleep and I lay
there on my phone like you're not
supposed to do and I read something for
a while and then I fall asleep. Now for
durations, as you can see right here,
there's no reference of course cuz we
don't know the awake time if I went to
the bathroom or a kid screamed or
whatever the case was that I had to go
sort out. So these are the total
duration times. The key thing I want you
to take away from this though is just
how different these durations really
are. That's probably the most
interesting thing here at the end of the
day. Likewise for sleep scores, they're
totally different, right? They're all
over the map. Though some days they do
tend to trend together. When I have
lesser uh time, like that first Tuesday
to Wednesday there, and I wasn't
sleeping any hours, that was I think
less than 5 hours that day cuz a bunch
of things going on trying to get the
house all packed up versus later on when
I'm now here on vacation of sorts.
Things a little more calm, and my sleep
scores are improved because I'm getting
a lot more sleep. As for HRV data, here
is HRV data on a chart comparing each
night and the overall score for each
one. Now, when I say score, I mean
basically how it averages HRV for the
night. Virtually all these wearables at
this point in time will simply give the
total average of your HRV value for the
moment you went to sleep and the moment
you woke up. How they assign the awake
time is where you tend to get some of
these differences here. By and large,
these are all trending in the same
general ballpark. The two outliers is
Fitbit tends to be a fair bit lower than
the rest and Amazfit tends to be a bit
higher than the rest. In the grand
scheme of things, the actual accuracy of
HRV data is probably the least important
of all the accuracy sets because all
these companies establish a baseline to
you. So, as long as these offsets for
HRV data are consistent, then it's
probably not a big deal for most people.
Now, lastly, breathing rate. This is
boring, but I happen to write them all
down, so they're all basically the same.
They only like move about one uh
breathing rate per minute per night at
most between the different nights I
have. So, it's not that exciting. So,
next up, we've then got step testing. Uh
this will be relatively quick so don't
worry. In the case of step testing, two
basic tests here. One is a set test for
a set number of steps. And then two is
looking the daily totals uh across a
number of different days. In the case of
my set test, I just simply walk out 250
steps, then I walk back 250 steps on
pavement with some slight ups and downs,
but basically relatively flat. You can
see the results here. Kudos to Fitbit
precisely 500 steps. Generally speaking,
when it comes to steps, I wouldn't
overthink these numbers. I mean,
congrats to Fitbit for nailing it spot
on. But as you can see from my daily
totals down here, they're all going to
be different every single day. You can
see here these three different days just
very briefly. Uh, one day was London as
a tourist. I went with the family on a
one-day layover we had uh coming here to
Canada. Spent the entire day walking
around the city of London with a bunch
of little kids. So, not quite as many
steps as you might have otherwise, but a
lot of walking there. Another day where
I did an interval run, the 10k interval
run I had, and then was kind of lazy the
rest of the day. So, you can see those
numbers there. and the third day where I
had a three-hour bike ride and then some
errands and things like that afterwards.
For the most part, these are in the
ballpark. But one thing you may be
noticing right now is the Polar Loop and
the Mazefit ones are way higher on the
cycling days. And that's because both of
those companies will convert your
cycling time into steps. You can get
into entire discussion around this, a
philosophical discussion. I think it's
stupid, but to each their own. I'm just
going to point out that that exists and
that's why those things are so much
higher. Now, the last category we're
going to dive into is calorie burned.
Uh, in this case, I've got a simple
chart for you yet again here, looking at
basically two different things while I
talk. The first one is the full day
calorie burn. You can see those three
days at the top there. Again, the same
three days, the London tourist day, the
interval run day, and then the gravel
bike day. Uh, and you can see the total
calories for each of those. And then
down below are a bunch of individual
workouts. Uh, some are auto detect and
some manual. And you can see the
differences there. I will point out that
yes, the Polar Loop legitimately gave me
a mere five calories for one of these
workouts uh there for 3 hours. Also,
you'll notice in the case that 50-minute
easy walk I did with my 10-year-old,
super easy out through the woods and
whatnot. In that case, only Fitbit and
Garmin detected that. Whoop did not
detect that at all. So, I couldn't give
you a calorie number for that because it
doesn't actually show that particular
workout in the app there. Uh and the
same was true for Mazefitit there. The
general trend here I see is that the
Garmin Circuit tends to be a little bit
lower than the kind of median, if you
will. Uh the Fitbit Air tends to be a
little bit higher than things. The Polar
Loop though tend to be about 50% higher
than everyone else on all of my
individual workouts and outside of the 5
calorie one anyways. And I can't really
figure out why. I wouldn't double check
the weight across every single app. It's
all the same, but this one consistently
is giving me way higher calorie counts
for individual workouts. So, if you want
to justify eating an extra pizza after
every workout, then definitely go with
the Polar Loop. Just don't expect to
lose weight with that particular
combination. Uh, okay. So, where are we
overall with all these sections done?
Well, in general, Garmin Circa is kind
of like in the mix of all the other
ones. There's no standout leader when it
comes to accuracy across the board here.
They're all in basically the same
ballpark for all these different
categories. Each one has small things
they do better or worse, but again, on
the whole, they're all pretty darn
similar from an accuracy standpoint.
Instead, I think probably the biggest
thing that Garmin needs to work on at
this point in time is their automatic
workout detection piece. It just simply
needs to get better. In the case of both
Fitbit and Whoop, they can kind of skirt
that issue a little bit because the fact
they recording their heart rate at a
higher fidelity and also assigning that
heart rate into their strain or cardio
load buckets 24 by7 versus Garmin is
only giving you that training load when
you actually have a workout defined
either using automatic workout detection
or manual. So when the automatic workout
detection fails, then you lose that
training load. And given Garmin's focus
on the athlete, if you will, someone
that actually cares about turning load,
I think that's a pretty big deal. I
think it's something they really need to
figure out how to address, either by
tuning that algorithm or just turning on
a higher fidelity heart rate nearly 24
by7. Of course, that's likely to burn
the battery quite a bit more. And thus,
you'll probably fall far short of the 10
days that Garmin is claiming. That said,
one key advantage Garmin has is the
button. By just simply pressing the
button, you can start that workout, end
the workout what you want, and you know,
you've captured the whole thing. I would
argue the button is actually a crutch in
this scenario. It's enabled Garmin to
kind of put this by the wayside and not
focus as much on automatic detection
versus the others don't have the button
and thus have to figure that out a bit
more behind the scenes or at least allow
you to correct it after the fact because
the data is still there. Finally, last
thing is bicep versus wristband. General
rule of thumb, and this is true across
all these devices and all of my testing,
the bicep will almost always produce
more accurate workout heart rate versus
the wrist will generally produce more
accurate daily stuff. So, things in
particular like steps, but also more
importantly, sleep. Uh, especially for
someone like myself that tends to be on
the phone when they go to bed at night
first, just being on the phone like
this, your bicep rarely moves and it may
think you're still asleep or you've
begun sleep versus the wrist tends to
move a little bit and most these
wearables detect the fact that you're
not quite yet asleep. Uh, of course you
can switch back and forth there. It's a
little bit fiddly in the case of Garmin
compared to the Whoop band, but that is
certainly an option. Anyways, if you
found this interesting, just go and
share this out to your friends or
whatever the case is. It really does
help this channel and the video quite a
bit. Have a good one.

### REPETICIONES. Conspiración en el Gym
https://www.youtube.com/watch?v=syba0b4jBeE

[música]
Muy bien. Vamos, chicos, vamos. No bajen
el ritmo. Vamos.
Muy bien. Excelente.
Muy bien, chicos. No bajen el ritmo.
Recuerden, 12 repeticiones exactas para
llegar al éxito. [música]
[música]
Vamos, chicos, que los veo hoy como
flojos.
¿Te has fijado que siempre son 12? Ni
una más ni una menos.
Es una rutina, Fermín.
Mi monitor cardíaco me dice que estoy
perfecta.
Rutina. Esto es un patrón.
Estoy seguro que las máquinas registran
hasta nuestros últimos movimientos.
Ha dicho patrón. Ha venido el dueño del
gimnasio.
Yo pensaba que aquí éramos. No me joda.
Yo pensaba que aquí éramos todos
curitos, jubilados.
Vamos, Juan, mantén esas paregida, si no
la ella no va a registrarlo
correctamente.
 la máquina me está pidiendo más
resistencia de la que puedo dar.
No te quejes, José. Mira la pantalla. Yo
he quemado 400 calorías en 10 minutos.
El algoritmo no miente.
Mmm, la gráfica de potencia va subiendo.
Me siento optimizada.
Esto no es un mero control sanitario,
nos están entrenando para algo más.
Son los registros habituales. Fermín,
frecuencia cardíaca, respiración,
consumo de calorías.
Ya estás con tus fantasías.
¿Ya has tomado las pastillas hoy?
Tus pastillas, pastillitas azules.
Cuidado, Fermín, que las carga el
Mirad esas gráficas. Redicen todos
nuestros movimientos, quieren optimizar
nuestra fuerza y longevidad.
Parámetros de fuerza y resistencia,
óptimos alcanzados. Preparación de la
fase uno completada.
Lo sabía. Están reclutando un ejército
senior.
Vamos equipo, los veo muy perezosos.
Menos cháchara. Vamos, 12 repeticiones
más.
Vamos, a mí no me la van a dar estos.
Que trabaje, Rita. Vamos a bajar el
peso. Mirad, las máquinas se ajustan
solas.
No nos están entrenando solo para
fitness, están entrenando para hacer
soldados longevos.
No me extrañaría que estén instalando
también sensores en los báteres para
controlar nuestras emanaciones
corporales.
Soldados senior, sensores,
emanaciones, [música]
esto es demasiado.
No soy Rambo, me duelen las lumbares.
Pues van apañados conmigo como no
quieran un gatillazo.
No hagas caso a Fermín. Juan, tú sigue
con las repeticiones, que es parte del
proceso personal.
Uno,
dos,
tres,
cuatro
cinco,
seis
siguiente.
Ocho,
nueve,
10.
Repeticiones incompletas, evaluación
comprometida.
Lo sabía. Somos una red.
Fermín, por favor, completa la
repetición número 12 para completar la
fase dos. No querrás que el sistema se
reinicie.
Fase dos, eso es lo que quieren que
haga, pero ya no entro en su juego. Esto
es una emboscada digital.
Preparación de soldados senior 78%
completado. Ajuste de resistencia
automática activado.
[música]
[música]
Ahora que sabemos la verdad, cada
repetición cuenta para decidir si
obedecemos o somos la oposición.
Pues para ser un ejército senior me
siento mejor que a los 20.
Rendimiento excepcional. Edad Media 77,
capacidad muscular más 35% analítica
óptima.
Muy bien, equipo, descansen. Nos vemos
mañana para terminar la fase de
resistencia.
Fase de qué? Mañana tengo podólogo.
Fase uno de reclutamiento finalizada con
éxito. Batallón senior en estado de
reposo activo. Preparando transferencia
a zona de despliegue.
No habrá más simulacros.
[música]
[música]

## Strong app vs Hevy app comparison

### Hevy vs Strong Which Workout Tracker Is Better
https://www.youtube.com/watch?v=X4crgqRYe7w

Heavy versus strong, which workout
tracker is better? Choosing the right
app can transform how you track progress
and stay motivated without feeling
overwhelmed. Both Heavy and Strong offer
unique features for fitness enthusiasts.
Heavy and Strong are popular workout
tracking apps designed to help you log
exercises and monitor gains. The core
difference lies in Heavy's
community-driven approach versus
Strong's focus on simplicity and
detailed workout analytics. Heavy is a
workout tracker designed to combine
exercise logging with a strong social
community. It allows users to create
custom routines, track sets and reps,
and log progress with ease. Heavy's
interface encourages engagement by
letting users share workouts, compete on
leaderboards, and follow friends for
motivation. The app supports a wide
range of exercises and includes a
built-in database for quick logging. One
of Heavy's strengths is its motivational
community features, which help users
stay accountable. However, this social
focus may feel distracting for those who
prefer a straightforward, private
tracking experience. Heavy is ideal for
users who thrive on social interaction
and want a dynamic platform that goes
beyond just logging workouts. Strong is
a workout tracker that emphasizes
simplicity and detailed data for
strength training. It offers an
intuitive interface where users can
quickly log exercises, sets, reps, and
weights. Strong also provides automatic
progression tracking and rest timers to
optimize workout flow. Its strength lies
in clear analytics, showing trends and
personal records to help users improve
efficiently.
Unlike Heavy, Strong does not focus on
social features, making it a more
private and distraction-free option.
While Strong offers fewer community
tools, it excels in delivering precise
workout insights and a clean user
experience. Strong is best suited for
users who want a no-nonsense app focused
on tracking strength gains and
optimizing training without social
distractions. Comparing Heavy and Strong
reveals different priorities. Heavy
social features make it excellent for
those who enjoy sharing progress and
gaining motivation from a community.
It's perfect for users who want
engagement and friendly competition
alongside tracking. Strong, on the other
hand, focuses on workout efficiency and
data accuracy, ideal for users who
prefer a streamlined private experience.
If you want detailed analytics and
seamless logging without social noise,
Strong fits better. However, if
motivation through community interaction
drives your fitness, Heavy stands out.
Both apps support customizable workouts
and track strength progress well, but
the choice depends on whether you value
social motivation or focused data
insights. Choose Heavy if you want a
workout tracker with strong community
support that keeps you motivated through
social engagement and shared fitness
goals. Opt for Strong if you prefer a
clean, distraction-free workout tracker
focused on precise strength training
analytics. Both apps serve different
needs, so pick the one that aligns with
your workout style for the best tracking
experience.

### I Tried the HEVY APP for the First Time at Planet Fitness (LIKES & DISLIKES!)
https://www.youtube.com/watch?v=z52fyFSQbLY

Hey everyone. In today's video, I'm
going to show you what it's like to work
out using the Heavy app. I'll be doing a
full review and tutorial after I've used
it for a few weeks, but I wanted to
share my first impressions and show you
exactly what a workout looks like using
the app. For this workout, I selected
one of Heavy's pre-made push routines.
You can create your own routines, but I
wanted to see what the app already had
programmed. This workout is part of a
push, pull, leg split, which is great
for beginners because it covers all the
main muscle groups throughout the week.
The rep ranges are intentionally higher,
allowing beginners to choose a
manageable weight and become more
comfortable with the movement. I did
make a few substitutions along the way.
For example, I replaced the barbell
bench press with dumbbell bench press
because of the gym I was training at
didn't have free weight Olympic
barbells. When I started the workout, it
kicked off with a warm-up. The warm-up
is self-guided, so while the app
recommends movements like leg swings,
arm circles, jumping jacks, and high
knees, it doesn't prescribe a specific
number of reps or duration. It suggests
spending about 5 minutes warming up, and
then you manually end the timer when
you're ready to move on. The first
exercise was the bench press. I used a
pair of 30-lb dumbbells for a total of
60 lbs and completed three sets of 12
reps, which I logged into the app. One
thing I noticed right away was that my
Apple Watch automatically synced with
Heavy, allowing me to see my workout
progress directly from my wrist. After
completing a set, I tapped the check
mark and a rest timer automatically
started. The timer appears on your
phone, your Apple Watch, and even as a
live activity on your iPhone's home
screen, which is a nice touch. Once the
timer ends, you're ready for your next
set. Another feature I liked was that
every exercise includes instructions and
a visual demonstration. So, if you're
unfamiliar with how to perform a
movement or set up a machine, you can
quickly reference the tutorial before
getting started. From there, the workout
followed a simple pattern. Complete a
set, rest, [music]
and repeat. For this workout, I
completed three sets of dumbbell bench
presses,
three sets of dumbbell shoulder presses,
three sets of the pec deck machine,
three sets of dumbbell lateral raises,
and I had originally planned to use a
specific tricep machine, but it was
occupied. So, I swapped in a different
tricep machine instead. One thing I
noticed is that when replacing an
exercise, Heavy doesn't automatically
suggest alternative movements [music]
that target the same muscle group.
Instead, you'll need to search for a
replacement yourself by typing it in the
search bar or searching by muscle. After
finishing the workout, the app provided
a summary showing my total training
volume. I could also add a photo and
share that workout publicly because
Heavy isn't just a workout tracker, it's
also a social platform. You can post
workouts, follow other users, gain
followers, like posts, and leave
comments. It's very similar to apps like
Instagram and Strava. Another feature I
like is that once you've completed an
exercise, Heavy starts tracking
performance data for that movement. You
can view personal records such as
heaviest weight lifted, estimated one
rep max,
>> [music]
>> best set volume, and best session
volume. Having that information readily
available makes it much easier to track
your progress over time and know exactly
when you've set a new PR. So, that was
my first experience using the Heavy app.
What I really liked about it was the
pre-made workout routine,
>> [music]
>> the automatic rest timer, the social
media features, and the ability to track
your workout history and personal
records. Since the app already
integrates the Apple Watch, one feature
I'd like to see is automatic rep
counting, which is present on apps I've
seen before such as Train Well. It would
have been nice to have specific warm-up
exercises, too, instead of just 5
minutes doing whatever you wanted. So,
if people need more guidance, they know
what to do. And also a cool-down
portion. After my last strength
exercise, the workout just kind of
ended. So, I'm not sure if other
workouts will have cool-downs, but if
they don't, that's something I
definitely like to have just to cap off
the workout. I'd also like to see some
exercise recommendations. So, when I was
swapping out the exercise, it didn't
give me a list of exercises that would
target the same muscle groups. It
required searching for it. I know apps
like Muscle Booster does that if you're
trying to switch out a program exercise.
So, that would be cool to have. Overall
though, my first experience using the
app was very positive. The workout was
easy to follow, the app was intuitive,
and I think beginners could really
benefit from using it. Now, I'm going to
continue using Heavy for a few weeks
now, and then later on I'll provide a
full review and tutorial. So, make sure
you're subscribed so you're notified
when it's ready. Until then, are you
going to use the Heavy app? Let me know
in the comments below. Thanks for
watching, and I'll see you in the next
one.

### Why Everyone Is Ditching Strong & Hevy for This Free App (Boostcamp Review)
https://www.youtube.com/watch?v=HxNSJCL3DRQ

After 5 years of using the same few
workout tracking apps and trying to find
the best one, I finally found the best
free workout tracker that you should be
using if your goal is to maximize your
progress in the gym. And in this video,
I'm going to give my honest review of
Boost Camp and break down all the
features that I've been using to get the
most out of my training sessions. By the
time I'm done explaining everything,
you'll know exactly why this is the best
free gym app on the market and have a
solid road map and how to get the most
mileage out of all the features offered.
And stay tuned because at the end of
this video, I'm giving away my free
hypertrophy program I built exclusively
for this app. And it's actually the same
program I used to lose 20 lbs within 90
days while maintaining all of my
strength and muscle mass. So, let's dive
right in to why you should be using
Boost Camp. So, one of my favorite
things about this app that immediately
got me hooked is as soon as I finished
creating my account, I was immediately
greeted by this program screen that has
thousands of pre-made workouts that you
could immediately access for free. Every
single kind of workout from hypertrophy
base, strength, hybrid, at home,
anything from 3 to 6 days, it's all
here. beginner level workouts,
intermediate, advanced. I just
absolutely love how I could get started
without having to do any sort of
research beyond just being on this
screen. Everything is immediately
available to be accessed. And let's just
say I want to go in and do some sort of
like low volume, highintensity program,
cuz that's kind of what I'm into. I've
always liked Dorian Yates. That's kind
of who got me into lifting in the first
place. I can take a look at this
program. It tells you all the details
immediately. And this one's actually
made by Dorian Yates. So, for example,
it's a 4-day split, high intensity. It's
12 weeks. It tells you how much each
workout is going to take on average and
then the recommended days that you do
it. And then before you dive into the
workout, you'll see exactly what it
entails and then know if that's right
for you. And then also, we have this
muscle engagement tab, which I'll
actually get into a little bit later.
So, unlike all the other apps I've used
like Stronger Heavy, I can immediately
dive into a pre-made program for
completely free and it's available as
soon as I finish signing up. And as you
can see here at the bottom right,
there's a community tab which directly
ties into all these programs that are
outlined here. And as you can see, you
could follow tons of coaches and users
on this app. And for example, if you're
a coach like myself and you have clients
that you're taking on, you could have
them follow you and see what workouts
that you're doing. And then on the
contrast, you could also follow them and
see what they're up to as well. So it
goes beyond just following random people
or people that you recognize from social
media. You could also use it to follow
your friends and kind of have some sense
of friendly competition. See what
they're doing, try to beat their [music]
scores. Everything like that is just
completely available from the start and
it's not something that you have to pay
an extra premium to access which I
really like. As you can see down here,
you could either invite someone directly
or you could look for someone on here if
they already have an account. And I like
how easy that is to use and access. And
I don't really have to go digging for
any of these features. The next thing
I'm going to go through this train tab
and I really like all these customizable
[music] settings that are available from
the start. The next thing I really liked
was this warm-up set template because
instead of just generic warm-ups that
you have to tack on to your workouts
that are already existing on apps like
Strong, you could actually set up a
template to have and have multiple
templates. So, if you have a default
warm-up that you do before every
exercise, you can customize that here.
And then, if you're doing some sort of
Olympic weightlifting movement with an
Olympic bar, you can select this with
empty bar feature. That way, you don't
have to type in 45. you just have the
empty bar ready to go and then you could
also do some sort of alternative as well
or add your own kind [music] and then
it's completely customizable and you
could add this on to any workout that
you do and unlike other apps I've used
this is the most customizable one yet.
You can also go into your weight units
and measurements which the weight
measurement and distance measurement is
pretty standard stuff but the smallest
weight plate option is something I
really like. You're not just limited to
going up in increments of five or 2.5.
If you're someone that uses micro plates
that you could personally buy or if your
gym has them, it goes down as low as
half a pound, even like a quarter pound.
You could enter in your smallest weight
plate based on what you have. You're not
just limited to going up in increments
of 2.5 or five. And that's something I
don't really see on anything else. I
really like that. And just like other
apps, you can link it directly to your
Apple Health, which really helps when
you're using the fitness app all the
time like me. And it helps when you're
doing certain workouts that are burning
certain calories, and you can kind of
integrate that into what you already
have going on on your other apps. The
key takeaway for everything I've gone
over so far is I've used this app to
kind of replicate my exact approach, and
I want to just pick up where I've left
off on the program that I was already
following. And this app allows you to do
that seamlessly. You can create your own
program from scratch. And then after
doing that, you could go ahead and
customize all the variables. And with
doing that, it allows you to be able to
pick up where you left off without
having to follow some sort of pre-made
plan if that's not something you're
into. So, everything I've gone over so
far has been completely free. And there
are tons of pro options that I've kind
of gotten into, but not fully. And once
I start using the pro version of this
app more, I really want to make another
video delving into those because I
really think it's something that's worth
everyone's time and it's something I
could see myself getting immediate value
out of. And the next thing I wanted to
go over in this app is how it directly
compares to its competitors like Strong
and Heavy. So the first thing I wanted
to go over is workout history. So, I've
noticed here that Boost Camp allows you
to have unlimited workout history as I
haven't seen anything in the pro section
that requires me to purchase it in order
to create more. But, for example, heavy
is only limited to 3 months. So, that's
something I already like a lot better
about Boost Camp. And then when I was
using Strong and Heavy, I noticed that
Strong only allowed me to have about
three workout templates and heavy only
allowed me to have four for free. But it
looks like Boost Camp actually allows
you to save as many as you want. Whether
it's your own, whether it's from a
coach, whether it's something you found
from a user, you could just save as many
as you want in your library and access
them immediately. And then obviously the
first thing I talked about was all these
programs. And yeah, Boost Camp has all
these free programs and apps like Strong
and Heavy simply don't. [music] So that
already makes me want to keep using this
app much more. And as you can see here,
you can kind of go to your training and
not just follow your own program, but
you can just start an empty workout from
scratch. So, I could literally start a
workout right now if I wanted to. I
could have a sample workout from this
little preset section, or I can just
keep adding [music] exercises as I want
to. And as you add the exercises, it
tells you all the muscles that they
bias. And then you could search them.
And then, like I said earlier, you can
create up to three custom exercises
[music] for free. So you could also add
those as well. So that's something I
really like about this app is just being
able to jump into an empty workout. I
don't feel pressured into having to
download a program or create my own. I
could just kind of do exactly what I'm
trying to do in the gym. And that goes
beyond doing hypertrophy sessions. If
I'm doing some sort of rehab work, if
I'm doing some sort of cardiobased
movement, if I'm doing mobility work,
anything doesn't have to be specifically
for lifting weights, I could log it here
and see what I'm doing. And I love that.
It's so easy to access and I don't feel
like I'm pressured into using anything
that's a feature on this app. I feel
like I have the agency to be able to use
the app how I want to and I don't feel
restricted in that. So, the next thing I
wanted to talk about is how I
specifically use this app to create my
own personal program and why it makes
training going forward a lot easier
having this specific layout. Something I
really like is you can kind of input
your strength scores right away. So you
can put in your body weight and then
kind of put in your maxes for everything
you've done across your lifting journey
and then see how that compares to other
people in the gym on a relative basis if
that's something you're into. I don't
really train for strength anymore, so I
haven't really updated my numbers
outside of what [music] I used to do in
the past, but it's cool seeing where I
used to be at one point when I focused
more on strength. And that's something
you could obviously optionally do and
[music] it's not something you have to
focus on if you don't want to. And as
you can see here in the progress tab,
it'll show you the streak that you're
on. It'll show you your lifetime stats
based on how many workouts you blogged.
You could use it to also track your body
weight as that either increases or
decreases. And then you could add
progress photos as well. So even that's
for before or after for a workout. And
then you could use that to compare as
time goes on to see if you're getting
bigger or leaner. And then the next
thing I wanted to go over is my specific
hypertrophy program that I built that
I'm giving away personally on here. The
link for that will be in the description
below. And I'm going to break down
exactly what this program is and how you
could use it in your own life if your
goal is to build muscle. So, one thing I
really like about this app is how I'm
able to get into the specifics with the
program that I'm making. In this
overview, I kind of just summarized the
program and it's low volume,
highintensity, hypertybased, designed to
be completed four to five days a week
with a dynamic 8 day a week split based
on 3 days on and 1 day of rest. So
obviously that doesn't fall into a 7-day
period because three on, one off, three
on, one off is 8 days. So that's why I
made it an 8day dynamic split. Your
muscles don't really know the days of
the week. They just know the stimulus
placed upon them. So that's why I'm not
really basing it on 7 days. And then in
the program details, I have it set up to
where the equipment is using gym
equipment. I'd say it's intermediate
level because as a complete beginner,
you don't want to be jumping into low
volume, high intensity that requires you
to go all out failure for every single
set. For the most part, you want to
learn the basics before you start
training in that low volume,
highintensity range. And then like I
said, frequency, I just have it 3 days
on, one day off, and then it just kind
[music] of repeats. And then time per
workout. I usually have it set around 60
minutes. Sometimes it takes a little bit
more if you're a little exhausted and
need to take some more rest time or
sometimes you can get it done a little
bit quicker. So, I'm not going to read
through every single thing here. But you
could obviously see it on here and then
when I also share the program with the
link in the description, you can read it
and see if it's right for you. But as
you can see, you can go down here and
see it's a pushpull legs and core
followed by active rest. and then push
pull legs core followed by active rest.
And then I wanted to kind of go over
this muscle engagement tab while I'm
here and how this is actually going to
help me improve my program in the
future. I could kind of see exactly what
I'm prioritizing more and that allows me
to open up blind spots that I didn't
have access to previously on paper. So
for example, you could see that this
program prioritizes triceps and upper
back the most. But what I could do is in
the future I could follow this program
and then do another program where I
adjust the volume where I'm kind of
cutting a set from triceps and then
cutting a set from upper back and then
maybe adding more sets to bias my lower
back and calves because calves are a
muscle you could add more stimulus to
without having to interfere with
recovery. So, I could always double up
my calves and do them on an off day. And
then I could also add more sets to my
lower back. And then everything's a lot
more balanced that way. That's something
I've never really had access to before.
And it's really interesting to see what
muscles that I end up biasing the most
and what muscles I've been neglecting so
I can adjust it in the future. In
conclusion, this app is the perfect
alternative to Strong and Heavy and any
other workout app that I've seen on the
market for free. Boost Camp has a
multitude of features immediately
accessible to you without feeling like
you have to pay for a premium in order
to get the most out of the app. I view
this app as being extremely easy to get
started in and learn. And it's friendly
to lifter of all experience levels. And
after using it for about a week or so,
I'm confident in saying that I'll
probably never go back to any other
workout tracker like Strong or Heavy
after figuring out how much value I've
already been able to get out of just
using it for a week. So, if you're
looking to level up your training and
get the most mileage out of tracking
your workouts in the gym, click the link
below to download this app for either
iOS or Android. Again, for completely
free. And like I said earlier, this
exact muscle truth hypertrophy program
that I built is available for you to
download and access for completely free
with the link in the description below.
I'll catch you guys on the next one.

## app que genera rutinas automaticamente

### GitHub Copilot genera HTML automáticamente cada día remotamente desde tu navegador | Rutinas IA
https://www.youtube.com/watch?v=LzMAkxOC4Zo

Hola, buenos días. En el siguiente vídeo
vamos a crear una rutina en el que vamos
a ejecutar diariamente una tarea para
agentes IA. Esta rutina se suele hacer
normalmente con cloud, pero en este caso
vamos a crearla con Jitha copilot.
Gracias a Control Note vamos a poder
crear esta rutina desde nuestro
navegador accediendo a los archivos
físicos de nuestro ordenador local.
Vamos a ver un avance.
Heo
[música]
[música]
Bien, vamos a empezar creando un
proyecto, en este caso mundial YouTube.
y vamos a elegir el tipo de agente, como
hemos dicho, copilot.
Vamos a elegir las nuestra carpeta de
trabajo, en este caso mundial
y vamos a crear nuestro proyecto. Antes
de empezar tenemos que crear nuestro
agente.
Lo registramos como por ejemplo con el
nombre agente mundial y vamos a elegir
el modelo, en nuestro caso Sonet 46
y le damos a crear agente.
Esperamos unos segundos. para que
nuestra gente se active.
Ya está.
Y vamos a crear nuestra primera rutina.
En este caso, como hemos dicho en el
principio del vídeo, vamos a crear una
rutina
que sea mundial.
la descripción
resultado de los mundiales
y vamos a empezar con las instrucciones.
Crear o actualizar una página
en la carpeta de trabajo que se llame
mundial.
Creamos una single page,
un HTML con estilos integrados
y le vamos a dar un estilo moderno
negro.
Como instrucciones vamos a decirle que
cree en la fila de arriba, en la parte
de arriba los resultados de los últimos
tres días y en la parte de abajo
los grupos de los países eh
en tablas.
Le vamos a pedir que obtenga los datos
de manera real y que directamente
codifique.
Antes de empezar tenemos que elegir el
directorio de trabajo,
ya que queremos que cada vez que se
ejecute sobrescriba el HTML.
Vamos a elegir el tiempo de
programación, en nuestro caso, nuestro
ejemplo, diario
a las 9 de la mañana.
[resoplido]
Esta es la descripción de nuestra
rutina.
Solo nos queda esperar hasta mañana a
las 9 de la mañana para nuestra primera
ejecución.
Como no vamos a esperar en este vídeo,
vamos a ejecutarla de manera manual para
que comprobéis cómo se realiza la
ejecución.
Ya está ejecutándose.
Este es el detalle de la rutina. Y como
ves, la gente ya ha empezado a trabajar.
Lo podemos ver en la actividad de la
gente. Todas [resoplido] las rutinas
tienen una tarea asociada y un workflow.
Si pensamos en el de la tarea, vemos que
está en progreso, cuál es su modelo, el
cloud Cloud Sonet,
y vemos cómo se está ejecutando. Ahí
podemos ver el directorio de trabajo y
si pulamos vemos que todavía no hay nada
porque está ejecutándose.
Vamos hacia atrás. Toda rutina realmente
es un workflow de un solo nodo y un nodo
trigger. Ahí vemos como el workflow se
está ejecutando. Si vamos a su workflow
podemos ver en el apartado de definición
cómo está ejecutándose y los workflows
tienen las ejecuciones. Desde esta vista
podemos ver el listado de ejecuciones.
Si esperamos un poquito, veremos cómo la
gente completa la tarea. Ahí está.
Vamos a ver cuál es el resultado. Ha
implementado un HTML
con los estilos en línea,
los ficheros dónde están, que se han
cambiado, etcétera. Vamos a pinchar en
la vista de ficheros y vemos el
resultado.
En esta vista de ficheros realmente es
una vista remota de nuestros ficheros
que están en nuestro ordenador VPS.
Por lo tanto, es como un browser remoto.
En este browser podemos descargárnoslo
en formato ZIP.
Vemos que ha terminado totalmente la
tabla con los resultados, etcétera.
Podemos descargarnos en ZIP, ver su
código,
verlo en HTML
y podemos verlo a pantalla completa.
Podemos ver a pantalla completa el
código y también el resultado.
Vemos que ha sacado los últimos datos de
los partidos de hoy y con las tablas
totalmente actualizadas. Este es un
ejemplo bastante bonito de cómo podemos
ejecutar una tarea diariamente
en el que mañana a las 9 se ejecutará y
se actualizará todos los días a las 9 de
la mañana.
Bien, esto es todo. Si os ha gustado
este vídeo, podéis suscribiros, ya que
tenemos preparados muchos más vídeos
sobre este contenido, sobre la ejecución
remota de agente y sía.

## autoregulation training app

### WHY YOU NEED TO LEARN ABOUT AUTOREGULATION (FBEOD)
https://www.youtube.com/watch?v=4mEH_10RTm8

All
right, I got to come clean.
Okay, I'm just getting ready for the
gym. I was wrong. Okay, I was wrong.
Um, no, I'm just playing. But I got a
message from some guy on Instagram and
he just corrected me on some of the kind
of math that I used in the video. Let me
see. Um, just about the the whole when I
was talking about yesterday trying to
maintain your relative body fat
percentage, I used that if you gained 2
lbs and you gained one pound of muscle,
one pound of fat, you would maintain
your relative body fat percentage. That
would only be true if you were 50% body
fat and obviously you are less than 50%
body fat. So the better calculation, the
more accurate calculation is for in for
in for instance if you are 15% body fat
or 20% body fat. The amount of fat that
you gain to muscle has to be in relation
to your current body fat percentage. So
if you are 15% body fat and you gain one
pound of weight over the course of x
amount of time, then for you to maintain
your relative body fat percentage, you
want to gain 0.15 lbs of fat to 0.85
pounds of muscle. So hopefully that uh
corrects things. But what's your name
again? Hold up.
Noah Holland, bro. Holland, let's go. I
don't know if I can vote for Norway cuz
I want like I'm part English and I kind
of want to see it come home. But
honestly, I don't really care. I think
the game's going to be sick. So, hope
you're watching, bro. And uh thank you
for the little correction. Um it's
obviously I misspoke, right? But it's
not really that big of a deal. The
direction of what I was trying to say in
the sense that to maintain your relative
body fat percentage, you're going to be
putting on fat and muscle. It's just the
proportion of each is going to dictate
your relative body fat percentage. And
then if you want to take into account
body recomposition, then you're going to
shift the scale in which you are gaining
muscle to fat even more. So anyway, I'll
see you guys in the car. Opportunity's
been knocking.
Oh wow, what a day.
See, this is the weather that I like.
Nice little overcast.
All right. Where? There we go. Same spot
every single time. Doesn't change.
Big session today. Do not miss.
This has got nothing to do with
bodybuilding.
Does anybody know ball?
Cue the neck harness and the finger
extensions.
Okay.
Holland. Holland.
Oh, we get a nice fresh haircut. We're
going to the gym. We ate some good food.
Oh, man. Life is good. You know,
life is good. You know what I mean?
All right, we're going to put our drinks
here. I'm going to slam my pre-workout
early today because I find that it gives
me a little bit more a little bit more
oomph in these in these little episodes
here. Hold up. Imagine
how psycho someone must be to talk to
the camera for an hour every single day
for the past like two months.
Insane, right?
But of course, the most important
question of all is, how are you guys
doing? How are you doing today? Let me
know what's good. Are you dieting? Are
you eating at maintenance? Are you
eating in the the forbidden surplus?
What are you doing?
How's it going? Are you reaching your
goals? Look at that. Whoa. Whoa. Ah.
I'm ready to honestly lift. I know.
Shocking, right? I'm going to the gym
ready to lift.
I'm pumped. I'm pumped.
Beat the log book. Okay. You still need
to have that mentality. Beat the log
book. All right.
with with all this kind of yapping going
on with the whole like reps and reserve
and 5050 reps and all these things, they
incredibly important, don't get me
wrong. Um, but with all of that in the
back of your mind, the number one goal
is to beat the log book. You need to
enjoy the process, right? If you are a
competitive person, setting ridiculous
strength goals in the gym and attacking
them, okay? Too much little No. No.
Attack your goals with velocity,
ferociousness.
Oh, I remember yesterday or two days ago
at the gym, I smoked the back of my heel
on a bench and I was bleeding out.
Bleeding out. Yeah. No, bleeding out.
Hold up. Let me put my phone on do not
disturb.
Um,
I'm ready to go. I don't know what that
was.
I'm I need Echo to send me out some more
pre-workout. I'm I'm I'm I've got like
four more sessions in me of Dethroner.
I kind of want to try a different
pre-workout to be honest. I've been
trying Dethroner forever. And don't get
me wrong, it's the best on the market,
most stacked, but I don't know. I kind
of want to try something different just
because
I mean like once you understand
once you understand that it's just
caffeine really um that's what's
actually going to improve performance in
the gym then the type of pre-workout and
all the other ingredients become very
second to none. So just to save yourself
money uh dethroner is great and don't
get me wrong there's still going to be
added benefits. It's just that they are
few and far between. Does that even make
sense? They're just not the same as
caffeine.
I can't believe I was um I was humbled
by by Noah Holland. No, I appreciate
you, bro. Thank you so much. Um
sometimes I misspe. There's a lot of
stuff that I talk about every single day
and sometimes I don't I don't think
about the numbers specifically, but
one thing that I do try to nail is the
the mechanisms and the actual underlying
kind of direction of what I'm trying to
say. If I happen to get like the
specific numbers mixed up uh or
incorrect, then um that's not as bad as
me getting a complete mechanism kind of
switched on its head. But yeah, anyway,
what if what if I was talking about your
people who are 50% body fat? Also,
completely switching the the story or
the talking point now. Silo, tap into
Silo. It's my favorite show right now. I
just, you know, when a show is so good
that it only comes out once a week and
you watch the episode and you're sitting
there like, [ __ ] I have to wait an
entire week for the next episode.
See,
I got called out on on my [ __ ] I'm
telling you guys to drink your
pre-workout an hour before the gym, and
I'm drinking it like 5 minutes before.
So, it's time to put my money where my
mouth is and take my own advice. And
plus me taking the pre-workout now, it's
going to start to kick in a little bit
about halfway through the drive and
we'll yap like crazy.
Wow.
I had that uh the brown sugar sub
substitute again today in my cream of
rice and god damn that [ __ ] was good.
Now is it as good as the
as the swerve stuff? I don't know.
Okay, I'm actually stuck in between two
cars here.
So, give me a second. These guys really
sandwiched me in here. I think I'm good.
All right, we're off to the races, baby.
Let's go.
Oh,
man. I just I'm hungry for some PRs
today. Seriously,
when when you have that when you have
that drive to train, it's Oh, I love it.
I love it so much. And there's nothing
like if anybody's been dieting um for an
extended period of time, you lose that
drive.
You lose that drive. You can you can
kind of hold it for a little bit, but
especially if you
have been dieting for like, you know, a
couple months, maybe a month, maybe two
months, you start to lose that drive.
Um, you can tell yourself, you can try
to trick yourself and be like, "Yeah,
like I can't wait to train." But there's
nothing like training uh eating close to
maintenance.
Now, I remember back in the day when I
was eating, that's that's usually why
people like to to talk about surpluses
and stuff like that. I'm not going to go
down this whole route of uh yapping
about bulking because I know it gets
boring. Um, and you're probably sick of
me saying the same [ __ ] but
you do you do feel really good. Um,
now how that correlates to
whether or not you build more muscle
in my opinion and what I've seen, no.
And you're just going to put on more
fat. And inevitably, you're going to
have to diet. And when you diet, you're
going to again lose that drive. And uh
depending on how fat you actually got,
it's going to take a long time to to get
yourself back to that position. So the
goal is now is to just hold your body
weight uh relatively close. Um body fat
percentage body weight like yes, your
body weight can climb, but your body fat
percentage is ideally going to stay the
same. So
I just remember that when I was like a
buck 95, 200, like going into the gym, I
was doing the most ridiculous stuff. But
I loved it. Honestly, this was back when
I was doing like push, pull, arms, legs.
Like that's the last kind of
I did push, pull, arms, legs. That was
my split for
I want to say
four years. That was probably my longest
running split. Um, second longest
running split was upper lower and then
third longest running split was
actually, you know what, full body is
now my second.
It it went like it went like bro split
then it went push pull legs then it went
like upper lower then full body every
other day and then push pull arms legs
in terms of like how long I've actually
ran the split and what pushpull arms
legs is what that's like
is that like 1.5x frequency? I can't do
the math but I'm sure you guys help me
with the math right now. I don't know
what that is. I think that's like one
point I think it's like one less than
1.5x frequency.
But man, I love that split. Uh the
reason being is because this was like a
classic UK bodybuilding. Uh Jordan
Peters, that's my guy. I love that guy.
I'm telling you, like he was the best
person I could have ever found in the
midst of my like bodybuilding or like I
don't even know what you call it, right?
just training career because he would
teach you
the fact that frequency matters. He
would teach you the fact that, you know,
low volume, high intensity. Uh even
though he doesn't even use low volume,
it's just like low volume per muscle per
session. Uh but because you're training
with a higher frequency, the volume ends
up in that in that right spot. But uh I
mean before he would have kind of weird
takes like oh get strong at all rep
ranges but he doesn't really think about
think like that now. I don't want to
speak for the guy. I'm just saying my
interpretation of what he has to say and
and what I believe that he believes. So
don't take it at face value. Um I got
he's got like the most respect for me.
I've got like the OG trained by JP gear.
Just uh absolute beauty. Um, but yeah,
that was like a a split that I used to
run forever. And push push days, it was
always you start with a low incline
press, right? And then you go to a high
incline press. So, usually it would be
like a Smith machine uh or dumbbells,
right? Low incline like 15 degree, 30
degree. And none of this like tucked arm
path. It was just completely flared. It
was the belief that, you know, it
doesn't matter the arm path. It was just
the incline was going to buy us more of
the upper pec. Like these are the
thoughts that I had like five, six years
ago. And uh so you would do two sets,
top set, back off, like one set would be
like um like 5 to eight. Holy [ __ ] this
guy's going quick.
I believe the rep ranges was like 5 to 8
then like 8 to 12. uh just completely
arbitrary like all I'm just thinking
back to what I used to believe in. Um
obviously like I used to believe that
you genuinely needed a surplus to grow
like not even not even to maximize
growth but to literally grow like to
actually build muscle. You needed to to
eat in a surplus. And I was eating like
I was grow like gaining a pound a week.
Not a not a pound a month, a pound a
week, right? Um absolutely insane. And
the stuff that I was doing was not even
like the training was fine. I mean I was
always training to failure. Um so so
start with the push day. It would be
like low incline press. So Smith machine
or dumbbells like two sets like one like
5 to 8, one like 8 to 12. And then next
one would be like high incline press.
Could be high incline. It' be like a 75°
bench. The idea was you're trying to
bring up that top line. that top line
being your upper chest, your front
delts, your side delts. Um, but again,
it had like there was none of this kind
of, oh, you want a tucked arm path to
bias the shoulder flexion component to
hit more of the fibers that hit, you
know what I mean? It was none of that.
It was just like just high incline, take
a moderate grip, uh, go very very deep.
So, I mean, you're you are ticking some
of that box. And a lot of the a lot of
the stuff too was press and get strong
in deeper ranges of motion. And the
people the the idea was that the people
that could control the the weight and
could actually take the weight through
that that deep deep deep range of
motion, especially like in the hole,
they would they would grow uh
significantly more muscle. I mean, it
was a kind of a weird idea, but I I I
can understand it. And then so you do
the same thing for the the high incline
press. You do two sets like 5 to 8, like
8 to 12, and then you would do a tricep
compound, right? And it would either be
like a close grip bench on the on a
barbell or ideally Smith machine or a
narrow grip press or like a JM press or
a dip. Those would be like the the the
three kind of main mass builders. And
then after that, you would do a fly.
You do a fly for like two sets, uh maybe
even sometimes three sets. And then you
would do a lateral raise. Uh I would be
doing like machine lateral raises or
like lying cuffed cable lateral raises.
Like I love I've been doing that
movement since I I started the gym. I
picked it up from Hypertrophy Coach like
six years ago, maybe seven maybe six,
seven years ago. Um excellent movement.
It's it's not even a it's not even a
science-based movement. Like that
movement is is ages old. Um, and then
and then it would be like a push down
and overhead extension or like a it
would be like a a crossbody
with two cuffs
cable extension and then like a skull
crusher or some type of overhead
extension. And that would be the push
day. um like two to three sets per
exercise, like five to eight reps for
like the the main top sets, and then
like 8 to 15 for like the the back off
sets. And I ran that [ __ ] forever, like
forever, ever. And even that same kind
of concept, the same like
exercise selection, I would still do
even on
um on all of the splits that I've ever
ran. like even on upper lower on upper
days I would still take those those all
those exercises and I would still run
it. I would do like flat or low incline,
high incline, tricep compound, tricep
extension or isolation, uh chest
isolation, side delt shoulder isolation,
and then I tricep isolation. I think I
said that. So it' be like chest
compound, shoulder compound, tricep
compound, chest isolation, shoulder
isolation, tricep isolation. So that's
like six exercises and there'd probably
be two tricep isolations. And then I
would do the same thing on full body,
right? I do the exact same thing except
I don't really do tricep compound
movements. I just do an overhead
extension instead. But um that's not to
say that they're bad by any means. I do
think that there's value in uh in
getting strong at a tricep isolation
like a tucked really getting that that
elbow extension more so than shoulder
flexion. It's raining. That hasn't
rained in forever. Holy [ __ ]
I'm actually excited for that because
I've been cooked in my garage lately.
And then we'll run you guys through the
pull day. Right. The pull day was pretty
much um
I wouldn't train arms. I wouldn't train
biceps cuz I'd go push pull arms legs
off. Push pull arms legs. So I would hit
arms three times a week, I believe. If
that's how it works. I'm not too sure.
Pull day, I would always start with
stiff leg deadlifts. Um, I would hit
them for more of an erector focus. So, I
wouldn't be really controlling the
eccentric. Um, not to say that that
would really do anything, but um, the
goal here was to not hit the hamstrings
really. It it's to just like pull with
my spine in neutral. Uh, having my my
torso parallel to the floor or as
parallel to the floor as I could get. It
would either be that or like a barbell
bent over row. The idea here was to
really get strong with some heavy weight
bent over to really thicken up the
erectors. And then after that, I would
go to lats because it was always harder
to get the lats short early on in the
session or later on in the session than
early. So, you would get the you would
train the lats first and it would always
be a
um there was no frontal plane work. I
didn't do any frontal plane movement,
any wide grip movement for the lats
particularly. I was tapped into upper
back pull downs because a lot of JP's
old training was influenced by Cass,
Coach Cassm, and uh that's what they
teach over at N1 is like upper back
Terry's pull down thing like that. I'm
not going to really get into that too
much, but
that's kind of like what they see from
their worldview. Uh who's he's very he's
brilliant. He's brilliant, don't get me
wrong. Uh do I necessarily agree with
the Terry's pull down? No. But um a lot
of the other stuff like I I've been
tapped into uh N1 for for a very long
time and I I really like some of their
stuff. Um but yeah, then it would be
like a narrow grip pull down, narrow
grip row. So the idea here is kind of
something similar to what I was talking
to you guys about like other sessions
where you would have like a a unilateral
cable pull down, which to be honest,
this was before JPG made this popular.
um like N1
and people have been doing like
unilateral cable pull downs for forever
and the same thing with unilateral cable
lat rows. Like those two movements have
been around forever. And to be honest, I
would argue that they're some of the
best movements that you could do for
your lats in a gym that require not a
lot of equipment, right? You just need a
dehandle, a cable, and a bench. And then
you do one where you have the cable
coming from above um you know around
that 120 degrees 130 140 degrees of
flexion. So you're you're queuing that
depression plus extension umh
for for the pull down movement and then
you have a like a rowing movement where
you're queuing more like depression
extension and then a little bit of
retraction just to train more of those
fibers that run horizontally. Now I
don't necessarily know if I agree with
that. Um it's it's kind of up in the air
really where
does it does it really matter if the if
the line of pull is going to align with
the the fiber orientation of those
particular fibers that run horizontally
or is it just the fact that because
you're training shoulder extension in
the sagittal plane they're they're going
to be trained adequately right like
that's kind of a
that's kind of a nuanced topic to be
honest uh we just don't really know so I
mean to be honest
You could you could tick your boxes and
just do all three, right? There's no
again, if you're training full body,
full body every other day, and you want
to uh do three sets for your lats,
because like we like we always talk
about, that's going to be kind of around
the close to the max that you're going
to be able to recover from, then why not
just do three exercises, one set each.
Do a a wide grip movement, do a narrow
grip pull down, and do a narrow grip
row. you tick all three boxes, you have
the potential for that that additional
benefit of the the fiber orientation
aligning with the line of pull. And you
know, you also take the kind of quote
unquote neuromechanical matching box of
doing both frontal plane and sagittal
plane movements to bias different
regions of the lats. That's what I
recommend. Um, if you're trying to cover
all of your bases and you really care
about lats, I recommend just doing uh
one set of of each of those movements.
Um, so yeah, there's that. So I would do
pull down row and then I would do like
upper back upper back row. I know I was
I was a row cell. It would be like a a
chest support, a T- bar row, and then I
would do like
uh upper back pull down, which was just
ridiculous.
And then I would do a 45 degree row. I
would do a rear delt row because the
idea was that the the fibers of the rear
delts run at this like oblique or like
45 degree angle. So if you like uh rode
with um a 45°ree ang like abduction, you
would be training more of the rear
delts, which to be honest, I don't even
think is like a
I don't think it's like a necessarily a
fiber alignment thing. I think that it's
more so you can row for the rear delts.
um based on like think about it the lats
they're going to be very strong
depressors um specifically of the
shoulder girdle. So that's why whenever
you're training lats you're trying to
have that simultaneous shoulder
extension and depression of the GH
joint. Um, so if you just have the
extension, that's where it's kind of
like this again this like unknown thing
that people are always arguing about
that is that going to train the rear
delts more. So, um,
I don't I don't know. I personally don't
think so. I personally think that the
rear delts uh and the lats are going to
be trained uh pretty adequately
regardless if you are queuing this
depression or not and you just have the
the the
main joint action being extension or
adduction but it's just something to
take into consideration like it's
something that's interesting
but uh yeah and then I would do the rear
delt row and then I would do like shrugs
uh vertical shrugs and then I think kel
shrugs too something ridiculous and then
I would hit arms arms. Arm day would be
pretty much preacher curl,
uh, cable extension,
um, step forward curl in, uh, overhead
extension. So, same thing I do now. Then
it would be like a JM press, like a
banded JM press, and then like a hammer
curl. And then I would do like wrist
extension and wrist flexion for my for
my forearms. And then the the leg day,
it would always start with like adductor
or it would start with calves. always
start with calves and then adductor
lying seated hamstring curl with uh some
type of thrust, some type of hinge and
then quads would always be at the end.
Um it would be like leg extension and
then like leg press and then it would be
always two squat patterns. It would be
like a squat p it would be a leg
extension to start and then like a squat
pattern
like a Smith squat, hack squat, pendulum
squat and then a leg press. Actually,
you know what? It was the other way
around. It was leg extension, then leg
press,
then the squat pattern, and then that
would be that would be the end. I think
I would train abs, too. Um, at the end
of leg day. And that was my split. That
was my push, pull, arms, leg split. I
ran that forever. Um, was it fun? Yes.
But would I do that again? Uh,
definitely not. I mean, full body is
going to mog that any day of the week.
And I mean, even back then, this is the
this is why I'm such a big proponent of
full body is because even back then,
like again, JP was my biggest mentor.
Um, he would always make videos and say
like like what what if someone's asking
what split should they run? Like full
body, that's what they should run cuz
that's what they need because you're
small and you're weak and everything
everything needs to come up and the best
way for it to come up is with higher
frequency. Like this is literally what
he would say. And I would be like, "Nah,
like I'm more advanced than that. Um I I
don't want to train full body. I don't
think I could do it. Uh that sounds
boring. I want to go to the gym 5 to 6
days a week." Like I was literally like
this. I was like, I need to go to the
gym five six days a week. Um 6 days a
week to be honest. Only have one rest
day. I never trained every single day
because I'm not that much of a of a
neat. Um, but yeah, like
he he was literally my my biggest mentor
and he would always say like you should
be running full body. And something that
kind of he used to do is Dr. Scott
Stevenson who's a a brilliant guy. He's
the creator of fortitude training. And I
used to run fortitude training when I
was working like construction and
working uh tenting industrial tenting.
And this split was again full body too.
And this was I believe that JP ran this
during one of his preps. Um and
fortitude training is uh what's there's
a an IFBB Pro 212. Is his name David
Henry or something like that? I don't
know. Maybe you guys could um pull that
name up. But he used to run it too and
he was very very uh
very crazy. Um and yeah, fortitude
training was peak. Again, do I
necessarily agree with it with now with
the things that I know now? No.
Especially with like the rep ranges
having metabolic stress is like a
um a driver of hypertrophy like all
these kind of um
uh outdated methodologies.
But anyway, moral of the story is run
full body. You need it. Okay. So anyway,
I'm going to have a fantastic session.
Hopefully you guys enjoyed the little
yap today and I'll see you guys uh
later. Let's go. I don't know. Norway or
England. Norway or England. I think it's
going to be a great game. So, we'll have
to see. Peace out. England. Let's go,
baby. Um yeah, England beat Norway. That
was a great game to be honest. I wanted
to see that go to extra time, but you
know what? Um as a football soccer fan,
I like that a lot. So, moving on, we
have Argentina versus Switzerland. Let's
be honest, Switzerland is getting
absolutely rolled. And then we have the
Conor McGregor fight. It's it's an
absolutely amazing Saturday. I am super
behind on work and steps and everything
like that. And today has just been an
absolute mess. Um the irritability
today, especially like in the gym and
post training, if you even breathed near
me, I was going to bite off your ear
metaphorically in game. Um I just I
don't know. Something was was going
through me. So it's all good, you know.
No big deal. We We all have those days,
right? It's not always going to be
sunshine and rainbows, but uh today I
just wanted to absolutely attack [ __ ]
So, we definitely made some poor
training decisions. We trained to
failure. We took some poor uh uh
increases in load, but you know what?
You live and you learn. It's not that
big of a deal. What matters is that you
take your sets close to failure. You do
the same exercises day in day out. You
get nasty strong. You set some crazy
performance goals that do not even seem
realistic. And you're going to see on
the leg extension, I know I touched on
the last training session, I wanted to
get back to my all-time PR of hitting
five plates on the top peg, and we just
did that. So, why was I able to make
such leaps in terms of my my
progressions? Because obviously, this is
a relatively newer movement for me. I
haven't been hitting it for um a
significant period of time. I've kind of
dipped in and out. So, I definitely had
some kind of room to really push and now
I'm probably going to be stuck at that
point where progressions are going to
come a lot slower, but that's perfectly
fine. So, hell yeah. We are alltime PR
on overhead extensions, alltime PRs on
supernated push downs. Very, very
pleased with that. Although these uh
overhead extensions were kind of messy,
um I'm okay with it because they're not
the absolute worst. I don't really care
to keep them like super super strict.
Especially with overhead extensions, I
find that when I try to hyperfixate on
keeping my shoulder like 100% still. Um
it just really takes away the takes away
from the movement for me unless I opt
for training in a slightly higher rep
range. It's just going to alter the
movement. Um it really comes down to
preference and again how well you're
able to stay with the same relative
technique session to session. So, with
this kind of setup, I lean into the
weight. So, because I'm leaning into the
weight, I'm having the weight pull my
upper arm backwards, which kind of
allows for that counter force as I pull
my my elbow into extension, if that
makes sense. So, obviously, I'm not
using like a preacher curl pad, but I'm
utilizing the weight pulling me back to
hold that that humorous in flexion. Um,
kind of a neat way to do it, but yeah,
that's what I like to do with these. And
pretty much the same thing. um just
violently extend my elbow in that
position. It's it's more of like a I
don't want to say like an advanced
training technique per se, but it's when
you when you can stabilize a movement so
well to the point where you don't really
have to worry about uh safety and you
don't have to really worry about any
kind of other joint actions occurring,
you could really just go to town and you
could just be as explosive as possible.
And that's kind of what I'm showing in
this movement. Now, it it was really
weird because my left arm I got six reps
and then my right arm I got four. So, um
to be honest, I was kind of a little bit
confused here. But you know what? It's
also maybe because I didn't rest
adequately between arms. Um especially
when you're really giving it your all
and you're training to failure. Um it's
definitely going to aid in in that
fatigue, especially uh contrateral,
which I'm pretty sure means opposite
limb. But anyway, not to mention I am
telling you. Wait, what the hell is
this?
I'm literally getting
Oh my gosh.
Okay, do you guys remember when on
TikTok, like back in the day,
there was this testosterone accelerator
book? This meme where it's like Tyler
Voss, this testosterone accelerator. I
literally just got like 15 notifications
on my phone for the video that's what
rate of gain per month to maximize
muscle growth and I have all of these
bots in my comments. Not going to lie, I
didn't expect much when I started
reading the mystical formula of the lean
body by Ryan F. I don't understand how
that works. Do they just pay like a
bunch of bots to I honestly have no
idea, but that's annoying. So, I'm just
going to have to mute all of those
people unfortunately.
And yeah, I just a lot of like look,
obviously there's the irritability. It
could be because obviously I was pushing
myself a little bit now that I'm
returning to to maintenance. Um, but I
don't think it's that. I just think that
genuinely I'm just very very stressed
and I have a lot of things that are
going on right now. Um, obviously these
are kind of ugly, these reps. But again,
I'm not too fussed on keeping these 100%
strict with my humorous uh not moving a
touch. I kind of like some some
movement. It's just my preference in
hitting the movement. Um, but yeah,
those definitely need cleaning up a
little bit, but instead of me lowering
the weight, I'm probably just going to
stick there because they're not too bad.
But, um, as I was saying, there's a lot
of questions that are that are starting
to really like tick me off a little bit.
Um, and it's making me not want to do
the Q& A's anymore. And the reason being
is because look, like I do this out of
obviously enjoyment, but I also do this
because I want to help you guys. But,
there becomes there's a time and a
place, right? And there's some questions
that genuinely it would require me too
much time, too much of my time to be
able to help that individual and then
it's just unfair completely for free.
Like I don't get anything out of it. Um
and I've been helping and making Q&As's
for for years now. Um and it's just like
when I respond and say apply for
coaching, it's either because a the
question is ridiculous and it requires
more nuance or b I just genuinely don't
want to answer that. And that's
perfectly fair, right? Um, and you could
say that, "Oh, well, why don't you just
not answer the question or why don't you
just ignore the question?" Well, I have
a hard time ignoring things. Um, I
either have to answer it or I just
that's that's my personality. I have to
like deal with it, right? So,
sometimes I'll be like, "Apply for
coaching." And then the snarky,
entitled, like little brat responses
that I get. Um, and I know like 99% of
people that watch my my videos, they're
not like that. Like, you guys are very
respectful. Um, and that's why I
appreciate it and that's why I continue
to do what I do. But there are quite a
few people in the comments that I will
um, kind of, you know, go out of my way
to answer their questions in Q&As's, but
then when I decide to drop and apply for
coaching because this is literally my
business, they get upset and they'll say
like, "Oh, like you're just another one
of these." Like, it's just I don't know
when I when I read stuff like that, it
really makes me not want to do the Q&
A's. Um, so just know that if I do
decide to stop um over like all of a
sudden, it's because of that stuff. It's
just it just drives me up the wall. And
like this is the same thing happens with
like Monday and stuff like that and like
other coaches as well. Um, I personally
have like a a higher tolerance to it,
which is why I do these Q&A. Like think
about it, who else does absolute free
Q&A every other day to answer their
community's questions? Like nobody. um
especially at the duration and the
proximity like or the frequency I mean
um of the Q&A. So I just feel like you
you don't understand what you're
getting. Um and when I dropped the apply
for coaching it's like I said it's
either because the question requires
more nuance to the point where it would
require like individualized approach
even when you don't think it does it
does. Um or I just genuinely don't feel
like answering it because it requires
too much of my time to answer. So, I
take that for what you will. Um, if
you'll take that as like a condescending
or like a whatever way egotistical. It
is what it is. Um, it's just like me
being real with you guys. But anyway,
moving back on to the training session
enough with my kind of yap. Um, I didn't
really want to do this video because I
was just absolutely drowning in work and
steps and and honestly like I really
want to watch the McGregor fight. I'm
super super stoked for that. He's my
favorite um favorite fighter of all
time. Now, no, he's not the best.
Obviously not. Um, but he is the most
entertaining and I mean to be honest, I
never thought he was going to fight
again because obviously he went down his
like druggy chronicles. Um, so I'm I'm
pretty surprised that he's actually
fighting, but I mean it is Max Holloway
and to be honest like I'd like to see
Max retire. I'd like to see McGregor
retire too. Like these guys are cooked.
Um, but yeah, back to the training
session. Uh, there was a couple bad
sets, couple bad eggs. Pretty much
everything was taken to failure today
because I was just in that mood.
And sometimes I'm just like that.
Sometimes I just feel like not leaving a
rep in the tank. And um is it the is it
the worst thing? Like I always said, if
you're training with single sets, um
it's not the worst thing to take your
sets to to zero RA. Now, to go for the
additional rep and to take that right,
cuz there's going to be a difference
between zero RA and momentary muscular
failure. I've reiterated this and I've
touched on this a million times, but
essentially zero reps in the tank is
when you complete a repetition and you I
guess you can never know for sure if you
have one more in the tank, but you are
to the best of your ability
um sure I don't know how how you would
word it, but to the best of your
ability, you don't believe that you were
going to be able to get one more
repetition with the same kind of uh
criteria of the last rep. So that would
be zero RA and failure would would be
where you essentially go for that
additional rep and you literally fail
halfway through or you can no longer
meet the same task demand. Now in an
ideal world, especially when you're
training this heavy because my
preference when I'm lifting, I like to
train in that kind of four, five, six
rep range um with the occasional three
every once in a while. Um you you
definitely don't want to be training to
failure because you just don't need to.
the weight uh is so high that the effort
required to move the load is so high
which is going to indicate that pretty
much you're going to have near maximum
mode unit recruitment anyway. So the the
added training to failure approach is
really just going to kind of exacerbate
recovery demands and take up more of
your training session um in the sense
that that acute fatigue is going to
carry over through the rest of your
training session. Um, especially if
you're taking everything to task
failure, you will, if you've ever done
it before, especially full body. Uh, I
do like 23 or 25 exercises. I'm not too
sure. I do a bunch. Uh, they're all
single sets. And like I said, this
training session, I took pretty much
everything to task failure, but looking
a little looking a little bit meaty in
this mirror, though. I'm not uh I'm not
too fussed. I'm really liking the flaps,
though. Um, the replacement for the wide
grip lat pull downs. I don't think these
are going to go anywhere anytime soon. I
am kind of nervous that the TNF cuff
straps are going to break just because
it's being held on via
um Velcro,
but for the time being, they are really
nice. And I like the the cuff straps
because they stay close to my wrist. Um,
now as I said before with the flaps, if
you're not used to it and you want to
kind of incorporate incorporate it into
your programming, make sure to stick to
like the eight to 10 rep range to start
just because you never train that joint
action um with that much load in an
isolated manner. So, it can get a little
bit crunchy. But, as you can see here, I
started out training it with like 8 to
nine reps. And then over two weeks, I
started to go from 8 to 9 to around six.
And now I'm all the way to four. So, I'm
I'm very pleased. I'm I'm happy to to do
sets of four with the flaps. Um I I'll
still work them up. And like I said,
when it comes to kind of autoregulation,
which just means essentially like
adjusting variables based on the
situation. One of the variables that I
like to adjust based on how I feel is my
rep ranges, right? Like I said, the
exercise selection is always going to be
relatively the same. Like the joint
actions are always going to be trained,
the ones that I care about, my main
muscle groups. But as far as the rep
ranges go, that is something that you
can have some wiggle room with. And what
I mean by that is you don't have to feel
so fixed and stuck in one rep range.
Now, yes, theoretically speaking, in an
unfatued state, you're only going to
have, you know, maybe four or five
stimulating reps. If you are an advanced
traininee, um, for a like more advanced
kind of muscle fiber, if that makes
sense. Because remember, hypertrophy is
fiber specific, modun specific, whatever
you want to call it, it's the same
thing. Um, but you're going to have
specific muscle fibers that are more
advanced than others. So those in an
unfatigued state are going to have less
stimulating reps than ones that have not
been well trained. So, the point that
I'm getting at is if you don't feel the
best or or a movement's not feeling the
best one particular session across the
week because of some variable outside of
your control, um whether it's sleep,
whether it's whatever. Although, I would
argue that if you have poor sleep and
more stress, it would be better to train
with lower rep ranges. But, for
instance, um there's nothing wrong with
trying to beat your best ever six,
trying to beat your best ever eight,
trying to beat your best ever 10. So, if
you're going in um every single session
and say you're doing like five reps,
five reps, five reps, five reps, and
after a while you come into the session,
you're like, "You know what? I don't
really feel motivated to go after my
five rep max, so I'm just going to go
after my 10 rep max." There's nothing
wrong with doing that. You can
absolutely do that. And it's a nice way
to kind of spice up your training over
time. Um and again, it falls under the
same framework that I talk about all the
time. um it's it's not quote unquote
suboptimal, although it really just
depends on how you define optimal, but
there's nothing inherently wrong with
doing so. And to be honest, I like doing
that as kind of a way of just um spicing
some things up, you know, increasing
motivation for the short term. Um and
remember that the motivation could could
persist over multiple sessions and the
motivation can persist across the same
session across multiple muscle groups
because it might just feel very very
good. Like if you've been training for a
while, you know that you just had one
set where you're like, "Wow, that felt
amazing." Um, and it could just be at
this different rep range. So, if you
guys see during the course of my
training over the next coming weeks or
whatever, I decide to, you know, um, go
after like a a slightly lighter load for
more reps, that is the reason being.
There's nothing wrong with that.
Remember, try not to get so caught up
into the dayto-day. Yes, your goal is to
beat the log book, but sometimes um you
you might want to beat the log book at a
different rep range, and that's
perfectly okay to do, assuming that you
understand programming and and fatigue,
um accumulation, things like that. So,
this set, um I did hit three reps again,
although I don't want to necessarily go
for three reps. If I get it, I get it.
And I'm very reluctant to wanting to
drop the weights because these are three
very, very clean reps. One could argue
that I had an additional rep there, but
I don't know if you guys pay too close
attention to my training, but last
training session when I hit that same
weight, the third rep went up extremely
slow. Um, so this time that third rep
kind of flew and that is just another
way of kind of assessing your progress
because even though you might not add an
additional repetition, your last rep
might come up quicker, which can be an
indication that you are progressing. Um,
if you think about one rep in terms of
like a spectrum, right, you're going to
have the start, middle, and end, etc.
And then depending on the resistance
profile, yada yada yada. Um, this was
stupid. Okay, this was stupid. Um, ego
got the best of me. I wanted to do a
plate again. We're back here. I feel
like, you know what? I was really pissed
here. I just chucked the bar. I was
like, ah.
Um, yeah. Like I said, if you looked at
me uh some wrong way or you breathed
down my neck, that kind of sounded
weird, but if you took a breath in my
direction, I was going to literally like
chew your ear off like Mike Tyson. Prime
Mike Tyson. I was just in that mood
today. Um, now obviously
it's not the most ideal thing. And then
after that set, I regressed this. This
is my first set that I've regressed in a
while. Um, so I I hit four reps last
time with this and then I hit uh three
reps this training session. So, it is
what it is. It's not the end of the
world. Um, I'll get it back next
training session. Usually, what happens
when I run into this scenario, like I
said, that motivation plays a huge role,
especially when you're training with
these maximal kind of rep ranges because
there is no there's no wiggle room,
right? You either have it or you don't.
And you're going to be much more likely
to have these these deviations in terms
of your performance session to session
if you are training with these really
really low reps because it leaves little
to no margin of error, right? You have
to have all of your I think the saying
is ducks in a row. I think I said some
other [ __ ] last uh couple episodes
ago, but you need to have everything
kind of on lock for you to be able to
perform at your best. Whereas, if you're
training in like an 8 to 10 rep range,
you have a lot more wiggle room because
the percentage of the one rep max is a
lot less maximal. So, you have kind of
the ability to have some wiggle room
there. And again, if you are someone
that needs to see that progress every
single training session and that is kind
of what you deem to be a good training
session, which obviously that's the
goal, but it's not always going to
happen, especially as you become more
advanced and you're training with lower
reps. Um, then training with slightly
higher reps is going to be the key
because you're going to see more rep
progressions at a higher rep range than
you will at a lower rep range. obviously
because the percentage difference of the
progression is going to be so much less
so than it would be at a kind of lower
uh rep number. But the thing is this is
what you have to understand is that just
because you can add more reps more
frequently with a higher rep range like
8 to 10, 10 to 12, etc. does not mean
you're progressing at a faster rate.
Because if you take two people and you
have one guy lifting in the four to six
and lifting very very heavy and he's not
progressing uh one rep every session, he
might be progressing progressing one rep
every four or five sessions or whatever
it may be. But the guy in that's
training 10 to 12 is progressing, you
know, a rep every other session or maybe
every session.
If you swapped places, the the strength
is going to or the the progression is
going to be the exact same from like a
muscular standpoint. As long as you are
taking yourself close to failure, you
are going to be growing at the rate that
you're going to be growing at. Now,
obviously, how are you going to be able
to dictate your rate of progress or your
rate of muscle growth? Well, it's it's
best to do that via your strength
progressions in the gym, specifically
from the movements that you consistently
hit every single day, right? So once you
kind of get outside of those
neurological adaptations, then a large
percentage of that increase in strength
is likely going to be due to
hypertrophy, right? Myofhibrarition. So
the point being is that although you
might not be seeing as quick progress
like on paper with your strength
training with a lower rep range, I mean
you still might because it's going to be
less fatiguing, you're still growing at
the maximal rate. um assuming that your
volume allocation is correct and your
frequency and all these other variables.
But uh yeah, big yap. Just ride the
wave. I promise you the low rep ranges
are the way to go uh for most people.
Now, this set I matched again. I think I
got four reps
with nine plate and a 10. I really want
to hit um did I say four plates? I meant
nine plates and a 10. Four reps. I don't
know. I want to hit nine and a half
plates. I want to get 10 plates on this
thing. Um, I think once I can finally
fully stack this whole machine, I'm
going to be going to barbell and I'll
kind of work up my my way. I think my
the most ever I've done on a barbell is
like five plates or five and a half
plates for like four or five. Um, I was
fat as fork then. So, uh, we'll see.
But, as you can see, I was just on that
timing on that type of timing today.
Like, just don't mess with me. Don't
look at me.
Like it's relaxed, bozo, it's not that
deep, okay? But we all have those days.
Look at this, though. Five plates,
single single leg. I told you I was
going to get it. There was no way in
hell that I was missing the set. Um,
again, is it the cleanest thing? I mean,
you'll have to you'll have to kind of
judge. One thing that I notice is I'm so
into the set and I'm not thinking about
literally anything other than just
moving the pad from A to B. That's
that's a like topic that I'm going to
touch on probably in tomorrow's video is
that you actually should be looking to
move weights from A to B. That's like a
a really ridiculous kind of sentiment
that people are trying to make now that
you shouldn't be looking to move weights
from A to B. Like that is literally the
goal specifically for movements that
have a low skill demand. Like there's a
reason why it takes no like you put a
monkey on this. Maybe not a monkey. You
put like
Never mind. I don't know where where I
was going with that. put somebody on
here that that is probably a little bit
slow and you tell them to extend their
leg, they're they're going to be able to
do it right without much command. So
that's kind of the point here is the
machine is set up so that you could
literally be brain dead and still
perform the joint action. And what is
going to be moving the knee in this
scenario? What's extending the knee?
It's your quads, right? So uh the people
that say you don't have to move weights
from A to B and you should like, you
know, have a mind muscle connection and
really like connect with your quads
just I'm going to go insane. Um, but
yeah, one thing that I notice is that my
my other leg, my alternate leg
is sometimes helps me on the concentric
a little bit just by default. And
there's a really cool kind of reason for
this. Um, and it's between that kind of
interheismic
communication, right? Because your left
side of your brain controls the right
side of your body, your right side of
the brain controls the left side of the
body. Um, and there's this kind of uh
interference, this kind of communication
that can occur. Um, I can't think of the
exact word right now as of this moment
in time because my brain is absolutely
scrambled, but maybe that'll be a yap
for tomorrow's uh video as well. So,
we're still rocking with the daily
uploads. Don't worry. It's just that the
Q&A's might have to uh might have to
take a little bit of a break just
because I'm gettingounded. I don't know
if you guys can see it in the comments.
And who knows, maybe it's just me. Um,
but I don't think it is like I feel like
I do a lot for this community. Um, but
yeah. Anyways, I'm not trying to self
glaze or anything like that. Look at
that though. Four reps with both legs.
Um, five plates in the top peg. That's
not That's not too bad. That's matching
my all-time best for repper. Um, I'm
very, very happy with that. Again,
everything in this training session was
taken to task failure or momentary
muscular failure. Like I always say on
this channel, do as I say, don't do as I
do. Um, sometimes I lift like an idiot.
Um, but even me lifting like an idiot is
still not that bad as you can tell. Um,
I just sometimes make poor training
decisions in terms of my load increases.
But that's part of life and that's why I
post all of my sessions on my channel
just so I can give you guys a voice over
of what's kind of going on in that uh in
that head of mine. Um, and you know,
sometimes you just got to send it all
within
the kind of optimal realm. Now, these
were a little bit rough. I'm not going
to lie. But actually, I've watched this
set back and it wasn't as bad as I
thought. Now, for some reason, there's
added friction because before when I was
doing this exercise, it was not feeling
like this crazy sticky, but it's feeling
very, very sticky in that mid-range for
some reason. So, I don't know why that
is, but honestly, I'm not too uh upset
with these. These got to around 90°. I
got four reps with zero in the tank.
Very, very happy. That's 300 lb. Um, my
hamstrings are cooked today. Um, now
this this was another stupid increase. I
did the stack plus 10 lb or something
like that. So, this is like the full
stack. What are you doing with your
glutes there, buddy?
Um, I can't add any more weight here, so
I'm going to be pushing up the reps,
which is perfectly fine. I I love when
you get to this this scenario where
there's nothing else to do other than to
push up reps. Um, so essentially what
I'll do is I'll I'll I'll push this up
to like five or six, then I'll kind of
figure out what I'm going to do from
there. But that's going to take me a
long time cuz like I said, it's a lot
easier to microlo and add a small bit of
weight than it is to go up an entire
rep. Um, which is why I do believe that
microloing is a valid kind of strategy
for increasing motivation because
sometimes you have not had enough of
those adaptations um to allow you to
increase a whole rep, but you might have
had enough adaptations to increase a
small bit of load. And again, if you are
someone that is, you know, super super
uh log book heavy focused, which can be
a bad thing for a lot of people because
it could lead to um you just chasing
loads, pause that you have no business
chasing uh or touching at this given
moment in time. But it is useful for
motivation. Um, and we know this 100%.
Like if you if you have been a
competitive athlete, you've been into
sports, whatever, having something to
really push you like the log book and
teach you to really push yourself and
chase down these big numbers. Like, if
you look at anybody that has some
ridiculous amount of strength that you
kind of admire, they didn't get there by
by chance. They got there by absolutely
beating their head against the wall,
metaphorically, in Fortnite. So, it you
just kind of have to ride that wave and
and it's a very it's it's a fine line
between um you know, taking it a little
bit too far um and as as I'm doing these
absolutely egregious uh barbell 45s. I
don't know what was happening today. I
think um I think I got possessed. Now,
these are not the best, but like I said,
the goal of this exercise for me, my
standardization is torso parallel to the
floor. And that is what I was somewhat
achieving. I think I got like three and
a half reps. Obviously, I don't count
half reps over here, but um I really
just don't want to have to microlo and
go from like three plate 10 and a five.
So, I think I was stupid and I just
chucked three and a half plates. Um I'm
just going to stick with that because
it's a relatively safe movement for me.
Um, again, I'm trying to hold that
contraction at the top for like half a
second just to ensure that I actually
get to that position without utilizing
momentum.
Uh, these calf raises, legs completely
straight or as straight as you can have
them comfortably. Pause in the, uh,
stretch position for like 2 seconds to
essentially take your Achilles tendon,
the elastic kind of recoil out of the
equation and then just press about
halfway with your calves. That's going
to be the best technique for your
calves, mainly the gastro. Um, and yeah,
now moving on here. This was really,
really stupid as well. Um,
knees felt great. Knees felt absolutely
great. No knee pain whatsoever, but I
did bounce. Um, not really, but I
definitely wasn't pausing them. So, I'm
definitely going to want to have a
little bit more control next time, but I
was just trying not to think about it
and just I really want to get myself
back up to like six plates on this. that
would be amazing. Um, so yeah, that's a
that's a big goal of mine that I'm going
to be chasing down. As you can see,
there's a little bit of a bounce at the
bottom. It's not really like it's
control eentric, but there is that kind
of bounce out of the bottom, and that's
what we want to avoid. Um, especially
with squat patterns. It's not the worst.
Like, you've definitely seen a lot worse
technique from people. Um, again with
this, my goal is to pause my my hams on
my calves at the bottom of the rep, but
again, my adrenaline and aggressiveness
this training session was uh a little
bit much and then I failed at the
bottom. So, and that's another thing I
wanted to talk about is did I really
fail or did I just [ __ ] out and not
want to go for the grind? Because that
is a an interesting thing. Obviously
with me um reviewing training feedback
on the daily like I've reviewed
thousands yes no thousands of training
clips from clients all around the world
and you can tell when someone goes for
the grind and someone bails out early
because I honestly think that I pussied
out. I honestly think that I had maybe
even like two reps in me. I know that
might sound ridiculous and crazy, but
there is like this type of mental
fortitude. Um, and this is not me trying
to be some corny like hard hardcore
like, oh, you know, you got to you got
to like gun to your head metaphorically
in Fortnite. Like you get these reps or
your your mom's going to die or
something in Fortnite. Um, but in all
honesty, there is something to be said
about that. And this whole culture of
like only doing a leg extension and not
doing your squat pattern has kind of
created uh this mess of people where
they they literally have like no drive
and their their
perspective of what task failure is is
definitely different. And we kind of had
this conversation. I think if you guys
remember Carter,
he definitely doesn't watch my videos,
but if he does, shout out Carter. He's a
OG in the SPL. Um we've had this
conversation, too. Like there's another
kind of theory that's no one really
talks about. It's called the central
governor theory. Um it kind of competes
with Maror's model but it's a little bit
kind of outdated but essentially you can
train your perception of effort to to
handle
higher um effort essentially like you
can train your maximum tolerable
perception of effort if you're thinking
about this from maroras and you do that
I mean you can do that with stretch
tolerance etc. Uh but that's another
topic for another day. So anyway, um I
bitched out. I probably had like one or
two more in the tank. I'm going to get
that next time. Let's get strong. Let's
go. Let's get jacked. Sorry, Jacob. I
stole your line. Um anyway, much love.
Thank you for uh supporting me and I'll
see you guys tomorrow. Let's go
McGregor. Hopefully he wins. Let's go
Argentina. Messi. Uh yeah. Peace out.

## deload week automatic training app

### Deloads & Tapering: Auto-Regulation, Common Mistakes, and Peaking for Competition Ep.9
https://www.youtube.com/watch?v=nvyvp6nk8zQ

[music]
>> Hello and welcome to the podcast. As
always, we have Sasha. Say hi to
everyone.
We have come to an end of the series of
programming 101 basics. Today, we will
finish talking about deloads and then in
the next episodes, we will have a mix of
debunking misinformation. Those episodes
really have impact on the community that
I've noticed more and more people
speaking about things that we actually
mention in the podcast, debunking
similar clips. We will for sure make
that a big part of the next episodes
that will come out. And also, we will
start the coaching Q series since we've
gotten very positive feedback about
doing that with a combination of posting
a few shorts and just talking about a
few Qs that are more personal, more
interesting that we've learned over
years and years and years of coaching.
We'll finish off the series talking
about deloads. Very often in the cali
scene, people don't talk too much about
deloads. I feel like especially in the
very advanced elite athletes, it's
something you rarely see because people
auto regulate their training a lot. They
go and train a lot by feeling and very
often this way deload or do less without
really noticing. And this is an
experience I had in the first years of
training just by feeling. I've never
really actively needed to deload. When I
was noticing I was getting tired, I just
did a few days easier and then pushed
again, which is great. And then there's
one crowd that
takes programs, especially in street
lifting, from powerlifting that are very
strict, very pre-programmed, where every
four weeks you have to deload because
it's written. What is your opinion on
this? What's your opinion on the one
side, on the other side? How do you deal
with this with your clients, Sasha?
>> The deloads actually do come from
weightlifting. So, basically, it's
usually regarded as a week where you
either do, you know, completely off
training or you do a week of easier
training. So, either those two things
The goal is usually to drop fatigue
because over the course of those, you
know, previous three or four weeks, you
have accumulated too much to keep making
progress. Now, you got to drop it if you
want to keep on building, right? I think
that that idea is a little bit flawed by
itself, but uh since there's many ways
to deload and nobody tells you that you
have to take a week off or it has to be
a week of easy easier training, that's
not really how it's going to work. You
can take maybe 2 days off, 3 days off, 4
days light training, so you can
auto-regulate it a lot. As I said at the
beginning, it comes from weightlifting
and I don't know the the the actual
story of how exactly they came up with
every fourth week you should deload. I
think it's something like those were
men, they were Soviets, and they were in
these camps. They were basically, you
can imagine like locked in there, very
focused. Those were training camps. You
cannot see your family while you're
there. So, they had like a structure, I
believe, where they trained for 3 weeks
and then they had a week off where they
see their families. The only way they
could make that work is to make those 3
weeks of training just a ramp up
drastically with volume. And, you know,
by the third week, you absolutely cook
yourself, you know, make yourself
miserable so that you can, you know, it
actually takes you like a week to feel
normal again. That way it can actually
work. So, I think that's um
that's actually how it came to life, the
idea of a deload. Now, if you just try
to copy exactly that without looking at
hey, what's actually happening and you
actually, you know, do very hard
training for 3 weeks and then deal with
for a whole week. I don't think that's
that's really good strategy. You have to
look at the context of why did I do that
like that? Could they have done it
better if they had other circumstances?
Yeah, so those are my initial thoughts
about deal loads. Didn't really say
much, but yeah, just a little bit of
history maybe.
>> Regarding deal loads, I feel like if
you're someone who auto regulates their
training a lot, trains a lot by feeling
and learns to listen to the body and
that's not something that's easy to
learn, you can go ahead and train
without big deal loads, no problem. If
you notice that you're more exhausted
than usual. If you notice that your
sleep start being off. If you notice
that some joints are starting to hurt
and some things feel uncomfortable, it's
worth taking a bit the pedal off the
gas. Of course, if you work with a very
structured plan where every single week
you start progressively doing a tiny bit
more. Over time, the volumes go up, the
intensities go up. You maybe train
slightly closer to failure. You will get
to a point where exhaustion will catch
up. And then at this point, it makes
sense to have and this can really be
either a week or a few days where you
train even lighter or take off
completely. And here, for example, on
the way I do this with my clients is in
general, most people can go for four to
six weeks without a problem, especially
if you start off quite easy and over the
weeks you slowly build up. You see how
they react to the volume. You see since
I feedback their videos every single
week, you see how they move if the
quality is degrading because that's one
sign of the where you might have to
deload as well. They they might feel
still great, but you see that the
quality of the movements are doing is
drastically going worse and worse, or
their sleep is off, they might have like
things that were easier before start
getting heavier. There comes a point
where it makes sense to take some time
where you go easier. I start with a very
standard protocol just because that
gives me a baseline and over time I like
to individualize deloads for people.
This means that in the beginning I will
usually half the volume of what they're
doing. I'll go down about 10% with the
intensities. If they have just started
working on a certain progression in a
skill, I might even just leave the back
off sets that's an easier progression
rather than the main progression. Here,
especially when working on skills, I
have found that taking completely off
for most people doesn't feel too great
if they're not very advanced and very
used to doing the skills because they
don't train the motor pattern during a
whole week and they come back and for
the first week everything sometimes
feels absolute That's also very
individual. Then with time when you have
like phases where you do maybe less
skills taking three or four days
completely off. If I'm, for example,
doing more bodybuilding kind of work,
that's very easy and there's nothing
great in repetition, I just take my time
off. My deloads are doing more cardio
and training less and traveling. So this
is how I program them for myself. Not
great because it takes me a while to get
into training again afterwards. Not
optimal, but just gives me the
possibility to travel. So I like to use
them more as a tool to go and do other
things in life that aren't training.
That's another point. Certain people
like to deload doing completely
different movement patterns. That's very
common in in weightlifting, I know. They
really do exercises they never do. I
don't like that as much because I feel
like it just brings more fatigue and
confusion and soreness into the game.
So, that's absolutely not something I
enjoy. I prefer doing the same movements
with less volume and lower intensities.
And in very intense and peaking phases
for streetlifting athletes, I actually
lower the volume, but I keep the
intensity slightly higher just to keep
the affinity to the loads still in the
deload and trying to get rid of the
fatigue by getting rid, for example, of
all accessories. So, these are usually
the ways I go. Then, there's people that
just like to do 2 days, the rest of the
days they take off or do other sports.
And then, there's people who still like
to keep the frequency the same. So,
there's really a lot that you can do and
the only way to find something that
really works for you is by experimenting
and trying things out and seeing how
they feel. I also like to use the
deloads to test things, especially for
skills, not weighted really, but skills
seeing after a few days where you went
easier, where are you standing, how are
the things feeling, is the work that
we're actually doing working? So, feels
counterintuitive to have a max set. It
gives you a good status quo and it
doesn't cause that much fatigue that it
nullifies the deload. People have a life
outside of training. You will very often
see that deloads will happen or make
sense around very stressful times
because outside stressors
make a huge difference. And usually, if
you follow a strict plan and just want
to follow through, you want to do a
fifth week because everything's going
well, is how people usually get hurt.
And there, it's important to actually
notice, my sleep is getting worse, I'm
not feeling so great, I have more stress
at work. I have exams at university. It
makes sense to actually keep this week a
tiny bit easier training-wise because
it's always like the drop that just
makes the glass overflow and people get
hurt from that. And honestly, that's it
with deloads. Most people do get a
rhythm, I feel like. I have people that
become robots and for sure it's psycho
like deep psychology plays a huge role
there. After 4 weeks, they're like, "Oh,
I feel tired. Now it's time to deload."
But honestly, if they have a very
stressful lifestyle, it works. Like
every 4 weeks having 1 week that's a
tiny bit easier if training is not
everything they do is a right. Usually
doing 5 weeks or 6 weeks and then having
a week off is a better rhythm to
progress for most. But as I mentioned,
per individual.
>> I have noticed that with people who are
more busy, which is majority of my
clients, they usually also struggle more
with motivation, honestly, and
adherence. And deloading can really
actually help you by, you know, wanting
to train more. So I do in practice use
deloads. I do it for dropping
psychological fatigue mostly and also as
you said,
testing. I think it's as you said
basically everything really valuable to
and it's not that fatiguing. It's not
really the biggest factor that's going
to determine fatigue, you know, just
your intensity. But
yeah, a great way to see where you are
and because, you know, usually the way I
program and you program, we don't really
do much, you know, maximal stuff
[clears throat]
during the trainings, during, you know,
the casual trainings. You still have to
test it every now and then to see what's
your new baseline. Is there a new
baseline? There usually is a new
baseline and then you can reassess your
program, make some changes to, you know,
continue evolving. But yeah, you've
reminded me about some mistakes of
deloads and I would say there are two. I
would say there's two biggest mistakes.
First one is deloading if you don't need
to or you don't have a good reason to
deload, or just forcing the volume
that's going to
force you to deload afterwards. I don't
think that's a really good approach. I
think you should just allow your body to
make adaptations for as long as you
need. If your program is going fine on
the work that you're doing, just keep
doing it. Even if it means 7 weeks, even
if it means eight. That's what I think,
that's how I do it. So, if there's not a
problem, I'm not going to push, you
know, a person to do more sets just so
we can deload later. Even if everything
is going fine, they've been progressing
for 8 weeks straight. At that point, I
still may add a deload just to test
things, you know, but not really to drop
fatigue. Of course, I'm going to add a
little bit less sets. They're going to
have a little bit less sets in that week
to also help them and maybe reset
motivation. And the third reason, people
thinking that dropping intensity and
adding volume is going to be less
fatiguing and that they're going to
recover from that. So, instead of them
doing their, you know, full planche with
their body weight, let's say they do,
you know, sets of 5 seconds, pretty
intense, they have a couple of seconds
in in reserve. They use them as working
sets. Then, during the deload, they will
take a medium band and they will just,
you know, do sets of 15 seconds, 20
seconds, and thinking that's it's low
intensity, but it's high volume, so we
recover. High volume, low intensity is
more fatiguing than vice versa. You have
like every single study ever, recovery
from eight sets of three is way faster
than recovery from three sets of 12.
High reps cause more fatigue than low
reps. Yes, even CNS fatigue. That's the
first thing. So, if you want to deload,
you know, maybe you can take on from
there because I've been talking for for
six six minutes.
>> Like if somebody has an 8 * 3, for
example, in their plan or 8 * 4, I'm
going to drop to a 3 * 2, for example,
or 4 * 2, but like really depends also
on how high their RP rating was in the
last week. So, if they were really much
slowly at the limit there and things
started to feel heavy, going to go extra
easy. And otherwise, I'm going to keep
it a bit more intense. Like, it's not an
exact science. Forcing deloads is a
mistake I made for sure for myself.
Like, before I was going on holidays, I
used to just myself the last week
before. Like, just, you know, to make
sure that I get all the work in that I
need to. And it's usually how then stuff
just felt off or started hurting. And it
took me way more than the holiday to
recover from it. So, mistakes made in
the past. Also, deloading, in fact, too
often. I find some people just find a
very good rhythm that works extremely
well for them. You have certain people
that have very interesting markers, like
a certain thing starts like hurting a
tiny bit or they're feeling some
fatigue. So, I think that's everything
to be said about deloads. Experiment.
Try a few things. Try taking a few days
off. Try doing lighter training. Try
different things in different phases.
When you train skills, especially a new
movement, make sure that you still have
it in there. Don't go and do 15 seconds,
but like reduce the volume and reduce
one or two seconds or just do the
back-off sets. If you were doing an 8 *
3 in the advanced stack and two sets in
a banded advanced stack, can also just
do the banded advanced stack if you feel
like your shoulders were very exhausted.
At the end of the It's not an exact
science. See how you feel when you start
again. So, in the first week after the
deload, don't go too heavy. Don't go,
"Oh man, I'm motivated again. I'm
fresh." And people just mess themselves
up in the first few days. Start slow.
Build up over multiple weeks again. And
then you will feel when it's time again.
Also, having a second person looking on
it and seeing certain markers because it
actually becomes quite evident. Certain
exercises just become heavier for some
people always almost mechanically
beautiful to see how precise certain
things if people have a very regulated
life, you can really see certain things
getting tired more often faster and then
you can use those as markers for the
deload or you can adjust volume the next
meso so this doesn't happen again and
you can push a few things that haven't
gotten as tired at the end of the meso
tiny bit more. So great to gather
information, great to understand an
athlete really and also to organize life
because at the end of the day a lot of
us aren't professional athletes. Rarely
people live off calisthenics then just
train and recover. So adjusting deloads
to phases where you have to focus on
other things in life is usually how
sadly deloads will be programmed in real
life for most people.
>> If you look at the science, there's not
much there to look at the deloads. I
think there's just one study on
hypertrophy training which found no
difference in you know something like
that but it was just one deload week. So
it was a nine week study and it was one
deload in between. Hard to know how that
would turn out in the long run. I would
say probably wouldn't make a difference.
Experiment try to do the amount of
volume that maybe you don't have to
deload every four or five weeks
forcefully. If you're progressing, keep
doing what you're doing. If you start
feeling like life is catching up to you
or you're just fatigued, drop some
volume down for a couple of days maybe a
week. Maybe you actually like deloading
every five weeks religiously. Maybe it's
good for you. I don't think it's it's
going to make a huge huge difference
over the long run.
>> A lot of our athletes do deload between
like four and six weeks. I think it's
the average and it really works super
well for most so
>> Adaptations do not to
quickly at all actually. So, stuff like
coordination, as you said, neural
adaptations. If you don't do anything
for a week, you come back, it's going to
feel weird at first, but even when you
come back, it's not going to be a whole
new process of learning. So, you just
have to remind yourself for a day or two
you didn't actually lose anything. Those
things stay. Hypertrophy, you know, if
you don't train for 7 days, you may lose
some undetectable muscle mass, you know.
>> I think after 2 weeks things become
detectable. When people get sick or so,
I almost feel like if somebody's out for
a week, they come back and after 3 days
they're back. If somebody's out for 2
weeks,
it takes them 1 and 1/2 week to get
back, usually depending how bad it was.
But after the 2-week mark, so when you
start getting into 3 weeks of not
training, getting back into training
starts taking longer than the time that
you were out for most people. So,
somebody's out more than 3 weeks, you
start having effects on a muscular
level. And at that point, especially if
you really don't move much, because if
you stay active, if you still use the
muscle in some way, very little is
needed to keep quite a bit of it. And if
you're eating still quite well, but if
you're in bed and not moving, then like
it's probably going to take you 4 to
even 6 weeks sometimes to actually get
back to it. It's incredible how much
muscle you can lose if you do not move.
This is something that actually shocked
me.
>> You're not using any fibers. All of them
atrophy.
>> It's brutal. But if you move like a
normal person and do normal activities,
not going to happen.
>> I think it's um 2 weeks until you see
detectable muscle loss, but that just
means detectable muscle loss, which
doesn't mean that there's zero muscle
loss happening even at 1 week. It's just
probably not that significant and
detectable with modern machinery. You
know, and whether it makes a difference
or not depends, I would say,
undetectable.
>> It depends also how messed up you were
when you went into the load, how much
damage you had, how long it really takes
you to completely recover. And one
interesting thing maybe to mention in
deloads, this happens if you deload for
longer time, like you do on actual 2
weeks where you really take off a tiny
bit more, which once a year is really
not a bad idea for a lot of people to
do. Very interestingly, people get like
random pains. Used to happen to me to
the past and anecdotally, I've seen so
many clients actually develop this. Feel
like the the body really starts fixing
certain things that you just were in the
background for ages and random pains
come out. You feel
like your elbow, you feel things that
you've never felt before. When you get
back into training, then they disappear
by themselves. But, I've noticed this
super anecdotally, but honestly with
hundreds of people over time very, very
often. And I also feel like in strength
sports, taking off for a longer period
of time is very rare. Well, if you look
at Olympic athletes or anyone that has
more an athletic background, they do
often take off completely from their
sport and do other things for quite a
while. At the end of the day, yes, you
might change the exercises a tiny bit,
but you always have the same pattern for
months and months and weeks and you keep
loading, keep loading, keep loading. And
I've felt like that with and this only
comes with a big training experience. If
you've been training for 6, 8, 10 years,
as I have, I had a year where I really
couldn't train as much. And it's
incredible how little you need to train
at a certain point to still maintain a
very decent level. And taking off for
longer time, like yes, you need to get
back into it, but if mentally it doesn't
frustrate you and you don't mind taking
those two or three steps back and you
can live with them and just work through
these phases by going to the gym and
training as you're brushing your teeth,
like you just go and do it,
you're going to be back very, very
quickly. But this comes with a big base
built over years and years and years of
training.
>> You know what what I think is funny
about it? That amount which takes to
maintain is very small, like super
small. The amount it takes to progress
is just a little bit higher. Of course
you have you have a room, you know, if
this is what it takes to maintain, takes
just a little bit to progress and we
have like
this much space to yeah.
>> You do have a lot of space to accelerate
the process, but over time the space
also becomes smaller and smaller. You
won't see people progress at the same
rate after years and years of training
and just adding
a few kg's to a pull-up will take you
quite a long time. We could shortly
still talk about tapering for
competitions. For tapers also I find
it's very, very individual what people
like and it's hard to have people that
have you've been following for long
enough and have had enough competitions
to see and understand what really works
for them. Um there's people that just
completely peak in a third week of
training always they have the best
results. They really feel super good at
that point in time and very often after
a time where they reduced volume, they
don't manage to actually get as good
results even though they should be less
fatigued and should be able to produce
more force and they need this continuum
and you can like peak them into the
competition, while the standard way of
deloading really depending very often on
how much load they're really moving like
someone who lifts extremely heavy and is
really smashed after the lifts for quite
a while will need maybe a longer taper
that's a tiny bit more chill and there's
like a very very fine balance there way
more than in a classical deload to
strike between keeping the intensity
somewhere that they don't lose affinity
to these loads and being actually able
to dissipate fatigue enough to actually
get to the competition feeling fresh but
still feeling the affinity to the loads
and not being like oh this feels
super heavy I'm not used to it anymore.
I've seen both worlds use a very
standard taper technique for most most
of my clients the first time around
besides if I really know they suck after
deloads like every time after we've done
a classical deload they have such a hard
time into training again. There of
course I will start changing around the
deload also because clearly is not doing
what it should be doing and those people
I will peek into the competition while
people that generally feel fresher more
motivated and great after deloads will
go with a very classical protocol where
you have one day where you have like the
openers of the competition so at 7 for
just two sets very easy and then a few
sets of back offs that are very easy
just to keep the movement another
session that's generally very very light
and then before the competitions best
two days before the competition an
extremely easy day do like a three times
two with 40% of their competition weight
and like just really go for the motions
for a few sets they go home after half
an hour they're done And then they
actually it's like very similar to the
concept of having a power day in the
middle of the week and then being able
to bring a better performance. There's
been a few studies on that actually. I
can find them and link them. Has worked
for most people quite well in
competitions. I've been always happy
with how the athletes perform. Then you
have like sleep, adrenaline, stress,
caffeine, eating right. But
yeah, that's very competition specific.
>> This is so nuanced for skills like it's
insane. It's actually insane. I can say
something about it for skills cuz I've
known I've known about tapers for like
three or four years. I've tried them.
Honestly, they do work. They do work. I
have unlocked full planches with two
people by using tapers. You know, when
somebody is very close, we usually do
like I did in in the past a two-week
taper back when I was still following a
Renaissance periodization and you know,
stuff like that. Basically just the idea
of a taper is to maximally drop fatigue
and you know, display the most superior
performance at the stage, you know, by
increasing your motivation to the
maximum by you know, not training that
hard by you know, towards the end of the
taper. But also just minimizing the
amount of central nervous system fatigue
you you have in your system if you have
any accumulated. You can take 10 days to
taper. You can take two weeks. You can
take a week and you usually divide it
into three parts. First third, you do a
bunch of volume and you know, you try to
keep intensity either the same or just
slightly lower. If you do usually
planches, you're going to do more
planches in this phase. In the second
third, you do just
half as little volume as you do
normally, but you try to up the
intensity a little bit more. So normally
you do planches, now you're going to do
a little less planches, maybe half of
the planches, but you're going to do
with the ankle weights just to prime
yourself whatever. And then in the last
third, you just keep that that same
volume, so very low volume, but you also
drop the intensity like crazy, like
medium bands, just nothing, you know,
questionable if it even does anything,
you know.
And then you should feel very good for
the competition or just for peaking.
Honestly, it does work. Unlocked full
planche, you know. Can you really say
it's unlocked if it's you have to peak
specifically for it? I don't think so,
but um and I also used it in my
competitions using the same same
approach. They do feel like you tend to
be a little bit stronger, honestly. I
have actually won a competition using
this. Of course, you can't say it's
because of the taper. Obviously, maybe I
was just the best in general. Maybe I
would still win if even if I didn't do
it. Funny thing about preparing for
competitions for very strong athletes
calisthenics competitions is, you know,
this all makes perfect sense for
maximal [clears throat] strength, you
know,
makes sense.
But on a really high level, we are also
touching that
both cardiovascular and local muscular
endurance. So, there's more things to
really worry about. Now, the fatigue
mechanisms that you're planning to
remove should work in the same way
regardless of that. Still, you will see
the top athletes literally training the
day before the competition. They do not
care. My theory,
they're just so good and, you know,
if you can do 20 planche push-ups, 30
planche push-ups, you can do five or 10
every single day, it doesn't matter. Not
nothing's going to happen. You can
obviously train infinitely, almost
infinitely, every single day. Yeah, it's
a it's it gets nuanced at that point. Do
I think that those athletes could be
slightly better if they, you know, maybe
have some structure before? Maybe,
probably. But, you know, who am I to say
anything?
>> It's very difficult because there's so
little data on it. Like the the way you
structure taper is exactly the same way
you structure usually a taper for a
weighted comp at the end of the day.
Besides like maybe the intensities, like
the priming in the middle of the taper,
that's something where you risk just
overshooting and then yourself
up. So, that's something that on the
weighted side, I usually don't do. I
keep the middle day quite easy also and
the last day super easy if it's like a
one-week taper. Some people I even done
two-week tapers, but it's people that I
know that no matter how long they take a
break for, they can still perform. Very
very important factor here regarding
exactly competitions like for example
when I prepared Yure for a competition,
like we had a super intense preparation
phase. Very much what you see the elite
people on Cali still like actually
working with complete sets and
combinations and doing them over and
over again or over a few months and like
extremely well tapered before like with
very easy two days before the
competitions he was doing advanced tuck
planches and stuff like that like super
easy. At the competition had a
performance never seen before and then
though he had a drop. Like he
kept going because he felt so good, you
know, and the ego took over after
competitions I usually for a week I tell
people, you know, take off, chill, like
don't do hammered Matthieu Van Gelder
like day after day after day. I think it
took two months almost three to recover
from that. So, exaggerated because
you're like in this super peak state
where if you aren't careful and go down
again and slowly build up to it again,
you mess yourself up. One of the most
interesting stories was client and dear
friend of mine, coach as well, Stefano,
was at the peak of his training.
Everything was going well, and he
decided without preparation to do a I
think five-day bike packing trip from
Genoa, where like Liguria, where he
lives to Rome. Completely new stimulus,
zero training for it, hundreds of
kilometers every single day. I've never
seen something like this. Like I really
doubted if I was programming something
wrong, but it had always worked until
that point. It took him months to
recover from that. He just couldn't get
back to performing the way he was
performing before. It was crazy. If you
do something completely out of your
comfort zone, and you're already at a
state where you've pushed your body for
a long time towards the limit, make sure
to give yourself some time to rest and
really recover from it. You know, you
think, I mean, it's lifts I've done
before, like maybe just a tiny bit more
maximal. I can get those 2.5 5 kg more.
I can hold skills that I usually can't
really hold for a few seconds. I can
hold them for longer, but the mental
aspect, the stress, the build-up, the
adrenaline after a competition, you will
feel it. I have a big respect for it,
and I've made experiences to start off
like again too early, maybe, and people
after 2 weeks like being it doesn't feel
good. Like this kind of hurts. This Just
give the body time to recover.
Especially if you really peak someone.
>> You know what is actually the most
important thing for a calisthenics
taper? It's losing weight. It's actually
not the training itself. People are
going to get this wrong, but factually,
the amount of progress
you can make from losing weight alone
while keeping your level the same beats
the
out of for your weight the same eight
doing any training method for the same
period of time. That actually happened
to me once. I did nothing that crazy,
but I did just um
This is going to sound funny cuz it's
not much. It's 60 km bike ride, but it
was uphill and it was quite intense for
me. Never done it. At that time I could
do like two front lever pull-ups. I
couldn't get to two front lever pull-ups
and doing my planches for literally
month and a half or two.
Biggest problems, you know, obviously
accumulate a lot of muscle damage from a
new exercise, from a new thing. Of
course, that causes CNS fatigue for up
to weeks, you know, week, maybe 10 days.
That's what the data says that can
happen. But also, I gained weight. I
think that was the bigger reason
actually because the hormones just go
crazy cuz
I'm a fat guy. I want to eat when I'm
hungry. And I think just that just
caused me to eat a lot eat a bunch. Got
maybe half a kilo, kilo heavier. And
until that weight is lost, you're not
really at your old level. Yeah.
>> I bike a lot. In the beginning I was
very careful about really dosing my bike
rides. And now I'm a bit more irregular
with my bike rides. And when I
exaggerate, like, you know, I've done 80
km over 1,000 m uphill before, and I
just go and I just do it and I paid a
price. But I know it. You know what?
Like it's different if you know it. You
you know how to accept it. But if it
hits you the first time, you're like, I
mean, it's not that much. Why? Why is
this happening to me? The interference
effect, which was so much talked about
in the years before, I feel like it's
very true for stimuli that you're not
used to. But if you're used to certain
stimuli, you can do both without a
problem. It's about managing the fatigue
and knowing when can I push myself, when
when can't I. Of course, there's an
upper limit. You can't do an infinity of
sport. But there's people doing crazy
 Like I've seen a dude two
months ago doing 10 Iron Mans in 10
days. And he's buff and he can deadlift
more than 200 kg.
>> Probably on roids, yeah. That makes zero
sense.
>> 10 different cities, 10 different Iron
Mans, and I think he also beat the
record. He's like from Great Britain. He
did one national deadlift record, I
think is in his weight and weight class
and age class. I'm not 100% sure about
that. And then did two back-to-back Iron
Mans. Like eating over 10,000 calories
during during that. Has a past, talks
openly about it. There's for sure some
demons there. That said, I think we've
really covered the deloads in detail. I
like that we talked about the tapers as
well. Makes it super different.
Absolutely weight loss 100% with
weighted calisthenics. It's actually a
bit more iffy because if you lose
weight, yes, the muscle up and the pull
up will gain, but the dip and the squat
often feel more shitty and your recovery
is worse, and you need to strike a
balance there, and I actually do not
like cutting besides water cutting
sometimes in the worst case scenario. I
prefer keeping people stable. The idea
of going way above the weight category
where they're training and then shortly
before while I'm peaking someone
cutting, I don't think that's a good
idea. You're stressed enough by peaking
yourself, and then peaking, cutting, and
water cutting before the competition,
people get to the competition, they're
completely It doesn't make
sense. Find a stable weight where you
know you can perform a few months
before, get used to that weight, let it
be a good weight where you can perform,
you can eat enough, and you feel well,
and your dip and squat where you're
going to get the most of the weight out
anyway will really matter. With uh these
closing points, I hope you enjoyed.
We'll be back with the coaches cues and
a few other very fun videos. Man, some
 you sent me is scary. Anyway, ciao
ciao.
>> Bye, guys.
>> Ciao ciao.

### This ONE Exercise Determines Longevity PLUS Deload Weeks & Rehab Questions
https://www.youtube.com/watch?v=T5tJMwkhZtE

Rather than asking like what I do to
maximize my recovery, first you should
think what can you do to maximize your
training that doesn't require all that
recovery to begin with.
How's it going? I am Jed Lindhart of the
Jed Lindhart podcast and once again I'm
here with Mia who'll be answering my
question or
>> [laughter]
>> You say that every other time.
>> She asked me if I was ready and I said
yes.
I lied.
>> Okay.
>> asking questions and let's get going.
>> Okay. First question. If you had to
judge someone's long-term health from
watching them do just one movement or
exercise, what would it be and why?
>> Ah, that's a great question. Oh my god,
that's hard to answer but I love that.
Um, well, I mean there's a couple ways
we could go over like a complex movement
here
that might have to be taught a little
bit but like the Turkish get-up.
You know, when someone does a Turkish
get-up, it just tells you so many things
about that person in one movement. Um,
pretty much because it takes your entire
body to be functioning properly to do
that. And coordination, basic level of
strength with all your major movement
patterns.
But that doesn't really tell me about
their metabolic health as much. Um,
oh god, that's such a good question.
>> I asked you if you wanted to know the
question in advance.
>> it. I love it. [laughter]
Um, yeah, I guess I would have to go
with the Turkish get-up unless I can
think about it but man, that that is a
really one movement to determine
long-term health.
>> Mhm.
>> You know, one thing is just
doing something hard for 2 minutes and
just seeing how fast their heart rate
would recover after that. You know,
something above your lactate threshold,
maybe climbing stairs really fast or
something like that. Um, and just seeing
how fast they can recover after that
would be a really good indication of
their long-term health. Something that
takes like
muscular strength to do like in their
legs, like a a base amount of muscular
strength um, that um, will get their
heart rate pretty high, and just, you
know, like
seeing how fast they can recover is a
big one.
>> Wait, um, Turkish get up, that's where
you're laying down with a kettlebell?
>> Mhm.
>> Wait, and you said it hits all the
movement patterns?
>> Yeah, it's crazy.
And like if you really analyze it, I
mean, not optimally,
>> Sure.
>> but it, you know, like even at the
bottom, you need strong back muscles to
drive your elbow into the ground, to get
your torso off the ground, you need a
strong core,
um, to press the kettlebell up at first,
you need, you know, strong pecs, and
then to transition to overhead, you're
going to need strong shoulder complex,
and then you need strong glutes and
hamstrings and obliques to stand up with
it. Yeah, it's like pretty much
everything.
>> Okay.
We'll move on, but if you think of
another one,
>> Okay.
>> feel free to share.
Okay, this is a lot of these came from
the DMs, so they're longer.
Um, so bear with me while I read this,
guys. I'm in a chaotic phase of life,
new baby, new job, don't have a great
schedule, or they're just two moves I
could superset every day for 10 to 15
minutes to not completely lose my
current fitness level, dot dot dot, not
forever, but knowing I only make it to
the gym for a total body workout maybe
twice a week, and it's not consistent.
>> That's a good one.
Okay, people are going to hate on this
one. It's like, so if you had to boil
down to two moves, oh my god. I'm going
to give them three.
>> [laughter]
>> You asked for two, but I'm going to give
you three.
So, the kettlebell front swing is such a
basic, but fantastic movement. Your
entire posterior chain, it works a
little bit of power, it's really easy to
learn. It can be used for a lot of
different things, depending depending on
how heavy you decide to go, and your
rest periods, and your technique. You
can do them single arm if you want,
alternating, but just the kettlebell
front swing, especially if you add a
band to it, is just like such a great
exercise. And then I would say push-ups,
which are great, um,
but if, you know, you're really limited
on like how much time you can do you
going to have to add blend some things
together which you know, optimally
you're not going to want to do that if
you have more time because things are
developed best
separately, right? So you don't want to
try to develop strength with metabolic
conditioning. But when you just don't
have the time, it's not an option that
you got to blend some stuff.
So a weight vest
like a something that you can do burpees
with safely. People hate on burpees man,
but
a burpee
into a squat jump
is really hard to beat for just a quick
total body exercise that's going to work
you know, you're you're pushing muscles
and your squatting muscles and your
heart and conditioning all in one.
And then the last one would be just the
simple chin-up. So like if you just
didn't have time and now I just
mentioned the Turkish get-up. So if you
can learn the Turkish get-up and you can
only I always tell people if they can
only do one exercise the rest of their
life
as hard as that is, I'd have to pick
pick the Turkish get-up. But you're
going to have to kind of learn it.
So you know, maybe on one day
all you do is three rounds each side of
five Turkish get-ups and challenge
yourself with it. It it'll smoke smoke
you way more than you think just doing
three to five Turkish get-ups. It will
get you gassed if you do considerable
weight.
Just do three rounds of five each side
three to five three three rounds of
three to five reps each side of Turkish
get-up on one day. On the other day do a
little circuit where you know, you're
doing like 10 to 12 front swings
followed by
you know, 10 eight to 10 burpee squat
jumps
followed by chin-ups and if you're real
strong where the weight vest for the
chin-ups to failure
rest and just repeat that three times.
And I know this is sounding really
CrossFit and I hate on CrossFit.
>> Wait, I was totally about to call you
out.
>> Yeah, but I mean like CrossFit is like
you know, there's elements of CrossFit
that are great when you just don't have
time to do to separate the elements of
fitness.
Um so
would they just combine strength
training and metabolic conditioning and
it's very time efficient. Now, there's
always a sacrifice there. That's why
people that do CrossFit, they don't ever
get like really strong unless they
they move on from CrossFit or really
powerful or really fast or in crazy good
shape like endurance.
But they're kind of good at everything
um in those regards. So and it's like
it's super time efficient.
And that's what you need, right? So you
don't have time to do an hour strength
workout twice a week and then your hour
of conditioning um
but right now, man, day one Turkish
get-ups.
Day two, that little circuit that I
described and then if you have a third
day and you can do it with your kids,
let's say.
Um
>> With your new baby.
>> New baby or with your new baby. So, you
know, maybe your baby has to be a couple
months old or few months old first, but
like when Levi was really young and I
need to stay in shape, I was kind of in
the same boat. You know, he's like free
weight. He was just basically just a
lump of weight at that point. So I would
just strap him to my chest and go for
long hikes with him and it was kind of
like wearing a weight vest.
And another thing I would uh I got one
of those baby things you can hook to
your bike and I would just ride my road
bike around the neighborhood and he
would just take a nap in the back. It
would like rock him to sleep and it was
a great workout for me, especially cuz
we live in Austin, so there's a bunch of
hills. And just trying to pedal his
little ass up those hills would get me
smoked. So
on a third day of the week, if you could
add that in, um just go for a long walk
carrying your son or daughter or
whatever the baby is and then or pull
them behind a bike. So the those three
things a week.
>> That's a great question though.
Okay, so
>> I love questions like that. Make me
think.
>> Uh well, this is a shorter one, but if
you mentioned weighted vesting
weighted vesting
>> Weighted vest
>> [laughter]
>> sounds like something that's illegal in
five states.
>> Weighted vest Maddie asks, do you prefer
a weighted vest or backpack for rocking?
>> That's a good question. Um, I so I get
that go rock which is kind of like a
backpack.
I put would prefer
a backpack for rocking or something
that's just on my back. And I and I
remember hearing something about this
one time but it does make a lot of sense
is when it there's weight on both sides
it like
the just it sits directly on that
brachial plexus like straight down.
>> Where's your brachial plexus?
>> It's like a bundle of nerves that comes
out of your spine. It get like runs like
>> Okay.
>> And so it
whereas if something's on your back just
the way it sits it ends up like kind of
pulling back on your chest and wedging
into your lower back a little bit so
it's like the weight's more distributed.
Um, so some people say it's it's better
for you like your especially your
cervical vertebrae and your brachial
plexus things like that if it's a
backpack rather than distributed front
to back.
Um, but I don't know it's probably not a
big deal. I just prefer a backpack or
something that's just on my back. And
then I can also kind of lean it forward
into it especially going up the hills
and stuff it doesn't like crank on my
neck as much.
>> Okay, next question. How much do you
prioritize recovery in your training? Is
it scheduled or you go by feel? I know
you like sauna, do you follow a strict
protocol? What are other things you do
and or things you wish you did more of
to recover better?
>> So that I mean it's a deeper question.
It's like everything now is hard. So
it's like we train really hard probably
harder than we need to or we should.
Um, definitely to a point of diminishing
returns and then we try to just like
recover super hard.
And it's like man if we would just back
off a little bit on some of of intense
training the hard training.
Because like recovery is very limited.
Like you can
and the more they look into it, the more
they're finding how limited recovery is
like as far as like, you know, let's say
you just take a rest day as opposed to
you do every little thing, compression
pants and TheraGun and sauna and ice
bath and sit on your [ __ ] $10,000
vibrating chair. The benefits of all
that as opposed to just [ __ ] resting
the day, I'm going to say minimal.
Honestly.
I'm not saying they don't have an
impact, but it's minimal. And the the
best thing you can do
is not do the things that make recovery
harder in the first place. So I'm not
just talking about your training, but
like a shitty diet, um but introducing a
lot of [ __ ] stress in your life that
doesn't need to be there if you can help
it. Alcohol and drugs, like things that
just make your body harder to recover in
the first place. Like first first thing
you do for recovery is just try to take
those things out as much as possible.
Second thing is like to find that
diminishing
point of diminishing returns in your
workouts and really think hard before
you pass that.
Like what do I mean by that? So if you
can get 80% of the benefit from doing
10 sets a week of per body part of
weight training as opposed to 25 sets a
week, is that extra 20% really [ __ ]
worth it if it's just going to crush
your recovery?
So really find the minimal effective
dose and go just a little bit above
that.
Or, you know, God forbid we periodize
our training and we kind of focus we do
a minimal effective dose for everything
else except one or two aspects of
physical fitness and then we focus just
on those. So we at buy ourselves more
recovery time. Like people hate to
periodize. They like to try they, you
know, some studies came out, you know,
that showed like we don't need to
periodize and and we can concurrently
develop different physical traits. So
people just think that's the best way.
It's not really. That's fine for
maintenance, but when you're trying to
get things better, it's best to just
focus on one or two things at a time. If
you want to get stronger, do the minimal
effective dose for everything else and
focus on getting stronger for a while.
If you want to get faster, do that, more
powerful, or you want to increase
increase your VO2 max or your metabolic
conditioning, focus on that and do
minimal effective dose for strength.
Periodization really does work and it's
and it's there because they understood
the people that developed periodization
just understood that the body has a
limited ability to recover and it's best
to just but it's best to just focus on
one or two things at a time. But what's
also really cool and goes into that is
it doesn't take much just to maintain
what you've already developed. So, for
groups of the certain times of the year,
1 to 3 months, just decide what you want
to focus on during that time, allocate
more energy to that, and then just
maintain everything else. And so, rather
than asking like, what I do to maximize
my recovery, first you should think,
what can you do to maximize your
training that doesn't require all that
recovery to begin with? And then the
second thing I already talked about,
eliminate all the stuff that's making
recovery harder first. Before you spend
$10,000 on a sauna, how about you stop
drinking three times a week? You know,
so I know a lot of guys and I love my
sauna, you know that.
>> I was going to say.
>> Sorry, Plunge.
>> you do spend $10,000, you should get a
Plunge.
>> Like, I and I don't really even do my
sauna for recovery. Um, I don't know how
much it does for recovery, honestly. I
do my sauna because it makes me feel
really good. I feel relaxed afterwards
and it's good for my health. And there's
a difference there between just
recovering something being good for your
health. Like, having a sauna is good for
my mitochondrial health, it's good for
my inflammation, and that's not just
recovery, that's just general health.
Whether I'm exercising or not, the sauna
is just good for you. So,
that's kind of where I'm getting at
there. Like, hey, let's [ __ ] pump the
brakes a little bit on just trying to
like, um, what's it called? There's a
term for it. It's like something
>> max.
>> Yeah, recovery on recovery maxing.
Everything is [ __ ] maxing these days.
Like, [ __ ] and [ __ ] just relax a little
bit. And the the weird thing is you'll
you'll perform better at everything is
if you just [ __ ] chill out a little
bit. Not you personally, I don't know
who this is.
>> Me?
>> No, the person asking the question.
>> [laughter]
>> No, you personally. You If you would
chill the [ __ ] out a little bit, I know
I would recover better.
>> Okay, well, speaking of
training
Okay, I don't know. You said something
about planning your training better so
that you could have to recover less.
Somebody else asked, "How should I
approach deload?
Um how frequently should I should I
schedule in deloads between programs or
months of training? When I do want to
deload, do I reduce volume, reduce
intensity, or reduce weight, or all
three?"
>> That's a good and in-depth question. I
could do a whole podcast now.
Um
>> You should at some point.
>> Yeah. Um
Okay, I think it's important for people
It depends on your personality.
For some people, yeah, I do you think
it's important that you schedule in a
deload, otherwise you just will never
take one.
I struggle with that, too. I always kind
of count on life circumstances providing
a natural deload, you know, like I'm I'm
getting ready to take a trip with Levi,
so like that's going to be my natural
deload week, right? So I might go to the
hotel gym a couple times, but I'm like I
That is like my plan where it's like,
"Okay, I'm not going to be able to work
out very hard for seven five to seven
days in a row. That's my deload week."
But other people, it's just like if they
don't plan one, they'll just never take
one.
And it is important to just give
yourself several days of breaks. It
doesn't have to be a week, but a period
of time where you are like getting your
heart rate up, you're moving, you're
taxing your muscles a little bit, but
like on
no day during that week do you feel like
super tired and drained. It's very
important to do that on occasion.
Now, how often is the deeper question,
and it really depends on how
big the deficit is that you're building
during your training. Like how big a
hole are you digging?
And
it is important to dig a hole during
training, to overreach a little bit.
That's how we supercompensate and get
better.
Um but, you know, the question is how
deep are you digging it and for how long
you've been digging it? Um
so, you know, if you can like plan your
training perfectly where like you're
just barely digging that hole and like
you're taking those breaks throughout
the week and everything is perfect, like
there's an argument to be made that you
never need to deload. But how often can
we do that? And how often and how good
are we are perfectly balancing our
training in relation to our life stress?
So, you know, sometimes life gets
stressful, you know, hard time at work,
you're not sleeping, or something with
your kid, and you're still training
hard. Well, that's going to be a bigger
hole than if you were training hard and
everything else was perfect, right? So,
like how good are we at actually doing
that?
And just for like mental health and
reset and so you look forward to
training again, I think it's important
to take a deload.
But it's impossible for me to give you
like a prescription cuz I have no idea
what your life is like, your training is
like,
things like that. And that being said,
when you deload, I think it's good to
keep the intensity high a couple days a
week. Now, this is I really want you to
listen to the details of what I'm
saying.
Keep the intensity high
and the frequency a couple days a week,
the frequency high and the volume really
low.
So,
intensity is not hard, okay? So, it
doesn't mean
I'm not talking about you take like two
or three sets to absolute failure.
Intensity can be a very light weight and
you're trying to move that as fast as
you can for a certain amount of reps.
So, in the programs I've been in during
deload, there's still days where we
focus on max bar speed. That's a huge
part of it cuz
you know, you're still trying to train
your nervous system and things like that
a little bit.
So, like
you know, that that week we might not
squat heavy or jump as far as we can
very much,
but there's a day where we take like 60%
of our one rep max, maybe add a band to
it, and just try to move that as fast as
we can for four reps, and we do that
four or five sets.
So, that that makes the intensity very
high. Not in relation to your one rep
max, but it's high in relation to how
fast you're trying to contract your
muscles, right?
Um but then it's cool that after those
sets, you don't feel tired or fatigued
really. You kind of feel fresh and ready
to go. So, general rule of thumb is your
training, even though some of the
intensity a couple days a week needs to
be high,
um you leave the training session
feeling better than when you started,
and that's the key element. Every day
during a deload week, you should leave
the training session feeling better than
when you started. So, even if you do a
couple max effort sprints during that
this a day on a deload week, let's say.
Um let's say max effort 60s, okay? So,
you're going to spend an hour out there
just doing mobility drills and
stretching and some A skips, so you feel
really good, and you do a few
accelerations, like 10 yards, some
bounding,
and then the way you do that is you take
long breaks. You're out there a while.
You're in the sun, right? You're
talking. And like if somebody's going to
ask you before you start the sprints,
how tired are you? Like, "No, I feel
great." All right, now let's do two
60-yard sprints all out with a 5-minute
break. That's still a deload week. Very
low volume. The 60-yard sprints are very
intense, but after those two 60s,
somebody asks you how you feel, you're
like, "No, I feel pretty good. I could
do four more." Like, "No, we're not
going to do four more. We're just going
to do two good ones, and we're going to
go home." So, that's what I'm talking
about a deload week. The devil's really
in the details there. And then the other
days, break an easy sweat, go for an
easy bike ride, play a game, you know,
like in in my programs during deload
weeks, we'd often just like play like
ultimate frisbee or something like like
one day. So, it's fun, and it's
sociable, and it doesn't beat you down.
Um and then a lot of like extensive
plyometrics, like easy skipping, jump
roping, pogo hopping,
um things like that. So, I didn't really
explain it cuz it cuz you can within
those parameters you can structure it a
lot of different ways.
But, uh,
leave every session feeling better than
when you started is is the most
important thing.
>> Okay. Next question. My parents are in
their 60s and aging. They quote walk
every day for exercise. Any advice on
how I can encourage them to move more in
a way to better their chances at aging
healthy and staying active.
>> Okay.
Well, if they're in their 60s, they're
Are they still baby boomers or baby
boomers older now?
>> I I don't even know what
Gen X means or any of those terms.
>> If we're going to be honest, I I got a
picture in my mind of what it means, but
Um, so if they're in their 60s, it means
they kind of grew up,
you know, in the 70s and 80s probably.
They were like adults like young adults
in the 80s and they have this notion of
what exercise is.
And if they haven't grown up
weightlifting, they have a notion of
what weightlifting is and how it's
dangerous and how it's for bodybuilders
and it's not for them.
And so,
that stuff really you're just fighting
an uphill battle cuz we we get our brain
thoughts and our patterns are wired in
at 60 and trying to convince somebody to
do something that they just believe is
not for them or they believe a certain
thing is just you're swimming upstream
there.
I mean,
old people get [ __ ] stubborn set in
their ways.
And trust me, we know, right? We're
getting there.
Um, so encourage them to keep walking,
but then simple things on that walk.
Like let's say there's a park bench,
right? It's like, "Hey, you don't need
to lift weights, but if you do like
every time you pass a park bench and
you're going to have to get creative
based on the route that they take, but
do 10 push-ups on the park bench. You
know how like the park bench the The is
really high, so it's like an elevated
push-up, so almost anybody can do that.
Just do 10 push-ups, and when you get
better, do your 10 push-ups on the seat
down below.
Um or do five step-ups each leg.
Or, you know, every mile, when you hit
this landmark, if if depending on how
strong they are, do four walking lunges
each leg. Like little things like that
will go a long way. And a lot of times
they have those like little jungle gym
things set up along the parkway or
something like that, or maybe you can
encourage them to walk there and and do
like four or five bodyweight rows. And
so, like microdosing resistance training
within a something they can just
incorporate into a habit and a routine
that doesn't require them to pick up a
weight, because they're not going to
want to do that necessarily, or go into
a gym, which is an uncomfortable
environment. So, find things in their
environment that they can add to their
the routine they're already doing to
enhance that routine is very important.
And then another thing that I I just
really wish would catch on with older
people is overcoming isometrics.
So, you know, they have these devices
now and where you can just stand on a
plate and pull up really hard on
something.
So, just, you know, two to three bouts a
week of a couple sets of 10 to 20
seconds of an overcoming isometric is
going to do wonders for maintaining
their high threshold motor units.
Um so, so that thing just isometrics are
just huge for older people. And then
whatever you're going to encourage them
to do, you have to fit it into the
routine that they're already doing, and
it can't be viewed in their mind as
something that like bodybuilders do, or
guys do. You know, like you're not going
to get your 60-year-old mom to start
back squatting or goblet squatting. Um
and and it's she's not going to be
comfortable in an environment that she's
not used to. She's just not. And then
any of these things they can do as a
couple is is even better. That doesn't
require them going off on their own and
doing something. And it'll just
encourage, you know, like, uh,
um, adherence because they can encourage
one another. So, but man, I honestly,
it's going to be an uphill battle
because people are just set in their
[ __ ] ways and I and I feel you there.
>> Moving on.
>> You get several questions about
injured shoulders and I know that you
have a personal
shoulder issue. So,
somebody asked for, um, how should they
rehab a
a shoulder after surgery? Somebody else
says, how can I still press working
around shoulder pain?
>> Okay, so, I just a rule now and I'm just
going to let people know, anybody
watching this, I'm not going to answer
these questions anymore for two reasons.
>> Mhm.
>> You don't give me enough details.
So, I don't know what a shoulder injury
means. Like, there's a dozen different
things that can be wrong. And and two,
and most importantly, I should have said
this first, I'm not a physical
therapist.
So, as a coach and a trainer, I can give
like do no harm things that ways to
exercise where I'm pretty sure it's not
going to make a shoulder worse,
but I I'm not like a rehabilitation
specialist. Um, you really need to pay
money to go see a physical therapist and
I'm just going to stay in my lane and
I'm not going to give rehabilitation
advice for orthopedic injuries. Now, for
a pulled hamstring or a strained muscle,
I feel fairly comfortable doing that.
It's within my professional scope of
practice, but you ask these questions
like, how do I work around an injured
knee or an injured shoulder? And I I
first of all, even if I was a physical
therapist, I'd be like, I have to
evaluate you. I have to go see the
x-rays. So, I'm telling you go get an
x-ray and an MRI so I can I can actually
know what's going on and I need and from
that, the doctor is going to write up
exactly what they see on the MRI and I'm
going to read it as a physical therapist
and then I'm going to evaluate you to
see where the pain is and where your
level is at and then from then then I
can give prescriptions on rehabilitation
exercises. But me going off a shoulder
injury as a non-physical therapist is
just unprofessional. And I'm No offense,
but I'm just not going to do it anymore.
>> Okay. Moving on. If you had to pick one
person who's played the greatest
influence on your approach to fitness /
lifting?
>> Oh.
[ __ ]
>> You have to pick one.
That's the rule.
>> All right, I'm going to go with an
unexpected one.
My high school coach.
So,
I had no right to expect
His name is Tony Geschwender. So, if
anybody's listening that knows this from
my hometown or knows Tony Geschwender,
he was one of the one of the two or
three individuals that had the absolute
largest impact on me in my life. And the
other ones are my brother and my dad.
So, other than immediate family, Tony
Geschwender had the largest impact on me
for the rest of my life. And thank you,
Tony. Always grateful for this in so
many ways.
Um
but first of all, let me tell a story.
Do you have time for a quick story?
>> Yeah, go.
>> So, when I was in eighth grade, we went
to we had a thing called a lift-a-thon,
which is really just a bench press
contest. And it was to raise money um
for to for our weight room and for our
football facilities cuz we're from a I
grew up in a in the country outside of a
really small town in northeast Missouri.
Shout out Louisiana, Missouri. Look that
up on a map.
And um so, I was in there and and at the
time, even though it was a small high
school, I just idolized these high
school football players, right? And I
thought they're all going to go to the
NFL. I did not know why they weren't
getting looked at cuz they seemed
enormous to me even though they were
like 200 lb and they seemed
incredibly strong.
They were so strong. I mean, they were
probably benching, you know, between 205
and 300 lb, right?
And, you know, me in eighth grade just
getting into weightlifting, I was not
even benching 135 lb yet and it just
seemed like there was no way that I
could ever get to their level.
And at the end of the lift-a-thon,
the coach called all the young down and
let them bench press. And I never forget
I bench pressed 115 lbs. And the co-
head coach Tony used to under spot me.
And um
after I got done with the rep, he patted
me on on the back and he said, "You're
pretty strong."
And like you know you have to understand
like this guy was my idol. Like he was
the head football coach of the football
program that I dreamt about playing for.
And for that guy to tell me I was pretty
strong changed my life.
So it just convinced me that like man,
I'm pretty if coach thinks I'm strong
then I'm strong. From then on out like I
knew I was pretty strong and I knew I
could get stronger and I dedicated
myself to lifting weights and believe
that I can do it. And every time
somebody was stronger than me, it was in
the back of my mind well, coach thinks
I'm pretty strong and so that means I
can get stronger.
And it just for you know everybody out
there it just goes to show you that
words matter. Like if one little word
that you might not think of, coach
probably get
coach Tony didn't remember this, changed
my life. Like good or bad, um talking to
a kid one phrase can change that kid's
life. And if you are careless with your
words and say you know, you're you're
not very smart or you're just not good
at this, that kid will believe that. And
what they believe they will become. So
be very careful with what you say to
young kids.
And and every all through my coaching
career I remember that moment with coach
and I was very careful what I said to my
kids. And I never said anything that
would cause them to change their
identity in a negative way.
And every time they had negative
self-talk, my antennas were up. And I
never allowed my kids
um to have negative self-talk.
But
that high school program was so advanced
compared to what you would expect from a
small town.
And he just he got it from I didn't know
at the time but looking back he got it
from Husker Power, which is um Boyd
Epley, legendary college strength coach,
the first ever full-time strength coach
in college football.
And you know, Boyd Epley's program was
just light-years ahead of its time
compared to what else was going on in
college football at that time. There
were other programs that were very well
advanced, South Carolina, some other
places.
Um and he started Husker Power, he laid
out a template, and you know, we started
doing plyometrics, we started doing
deload weeks, we started focusing on bar
speed, we started blending bodybuilding,
powerlifting, and Olympic lifting
together in a smart periodized program.
We had an accumulation phase, we had a
transmutation phase, an actualization
phase.
Uh we would do the things you see on
Instagram now, like these, you know,
hurdle hops and like repetitive box
jumps, single-leg bounding, we were
doing in this small town of 2,000 people
in rural Missouri in 1995.
And it transformed me physically, and um
can't be more grateful to Tony Shnur.
>> All right. That's all we got.
>> All right, guys. Have a good one.
>> Take Oh, and I will say, if you are
watching this in YouTube and you have a
question for Jud, drop it in the
comments. We read all the comments. If
you watched this far,
leave a comment. Just say comment. Um
and if you're listening on Spotify or
Apple or somewhere else, we get the
comment uh sorry, the questions from
Jud's Instagram stories at least once a
week. We ask for questions. Um you can
DM them, but it's just hard to catch.
Um
but that's how you can have your
question answered.
>> All right, guys. Till next time.
>> [music]

### Upper Body Day After Deload Week On the HEAT Program
https://www.youtube.com/watch?v=cgn853aie4g

[music]
[music]
>> What's up, guys? Today, we got an
opportunity
to get better in the gym here. It's a
Monday. We're on the Fitness Culture
Heat program. [music] You can check out
a free week in any of our programs
anytime you see me come into this, just
click the link below. Make sure
you check it out and get that because
it's going to be something that you
know, you're going to want to have
access to that app. Today, we're doing
the Heat program. We're on a new cycle.
So, last week was a deload week, which
still means we're you know, we're
putting in work. Total volume was down a
little bit, which was great. We also got
our body fat tested. I was actually
pretty surprised. I got a tattoo. That's
not a That's not a scratch and sniff and
that Well, if it did, it would smell
like freedom. I can guarantee you that.
Um but
got the tattoo, [music]
got the body fat checked last week. Last
week was very busy. We even moved back
from St. George. I drove the U-Haul
back. We're up in Boise, Idaho now.
We're training at Empire Fitness. We're
[music] going to jump into this workout.
We're going to get just downright and
dirty with it. It's going to get me
heavy. It's going to be gritty. We're
going to have to dig deep and have a
jolly old time. Let's get it done.
Bench press, baby. We're moving away
from close grip. That was our strength
cycle we did the last 4 weeks in this
program. Moving on to bench press today.
Everything in the app is beautiful. When
you test, it automatically throws your
percentages in there. So, I got 65, 72,
77, and 82% of my 1 rep max super set
with some power raises. You get 2
minutes rest.
All right. Today, we're getting to go
a little bit more normal on the bench
press. So, we've been doing close grip.
That was our first strength strength
phase. Now, a little bit wider, still
keeping the chest rib cage down and
back, pressing to the sternum. If you're
like me,
shoulders want to get a little bit wide
always. We want to pull down and back.
Really make sure that we're lats are
engaged on this. Coming straight [music]
down, straight up. I don't want Again,
one of the things I always do, I get a
lot of bend at the wrist. Stay a little
bit more neutral.
Definitely feel stronger than I did when
we started the program.
Hey.
Didn't even see you there. 2 minutes.
>> [music]
>> It's actually hard for me to rest 2
minutes after kind of doing all the
Hyrox training. Feel like I'm not doing
anything. So, if you need to, if you're
like me and actually speed up the
workout, get on a clock, [music] have a
partner go back and forth with.
>> [music]
>> I do love a pal raise.
Big thing on this, keep this straight
arm straight and in line
with everything. So, we're making
almost like a T here.
>> [clears throat]
>> Stabilize yourself there.
3 seconds. [music]
It's going pretty good. Much better than
the day we maxed on bench press. So,
jumped up
approximately [music]
15 lbs more than I should have. So,
we'll see how that I should fail on this
one. So, I'm going to get a spot. I got
six reps.
Just going to concentrate on smooth,
solid reps.
>> Here we go.
>> One.
>> Two. Three.
>> Yep.
>> Let's get it. Come on.
Stay tight.
Here we go. it.
Oh, we got to get this up. Come on.
Let's go.
All right.
How many do we got? Let's go. Last one.
Oh. Oh, no.
>> Working out with 45 lbs for [music] six.
We got four sets of six here. Super set
with a trap three raise. Really focusing
on
>> [music]
>> today upper body strength movement plus
some mobility exercise for the
shoulders.
We really want to focus on shoulder
blades down and back.
Full range of motion.
You guys probably have some sticking
point here at the top.
Stay light on this one.
>> [music]
>> Big thing right now for me,
I'm going to start really dialing in.
I'm a little fearful that
my
protein intake is kind of like my body
fat.
I'm grossly
overestimating how much protein I'm
consuming. So, this week will be going
back to counting macros.
We'll be getting on like just eating the
same meals every single day.
>> [music]
>> Grab some protein spot meals.
Have my breakfast.
Two protein spot meals.
Pre-workout shake.
Post-workout meal.
Dinner. I know there's no way I'm
hitting 230 grams [music] protein. And
that's where I think the biggest case
when I hear people saying like, "I can't
hit my goals. I'm working out, you know,
every single day. I'm getting my sleep.
Drinking my water." I'm like, "Well,
how's your eating?" "It's good. Like I
don't go out to eat."
How are your macros?
Because what we think is healthy versus
really what is, you know, crucially
important is getting enough protein,
minimizing total calories. Like total
calories will dictate weight loss.
Macronutrients will really dictate body
composition.
And then we have micronutrients which is
going to dictate how we feel.
When we combine all those things
together, we're going to have a really
hard time not hitting our goals
>> [music]
>> if we're following a meal prep or a meal
program that we know. And that is the
one thing I think we do extremely well
in the Fitness Culture [music] app. It's
not just a cookie-cutter
one-size-fits-all. We have flexible
dieting like if it's your macros, we do
carb cycling, intermittent fasting,
keto. We kind of tailor cuz I don't
think there's just one diet that works
for everyone. I like flexible dieting to
a certain point. I know there are people
that do really well under keto. I know
some people [music] that love fasting in
the morning. So, it's about fitting what
you need. Again, in the hierarchy of
needs, calories,
macronutrients, [music] and
micronutrients.
And, you know, and then making sure that
we're drinking enough water
um and supplementing correctly. Kind of
in that order. So, we give you the tools
on the Fitness Culture app.
You just got to make sure that you're
doing it. And that's the hard part.
>> [music]
>> Say hello to my friend Arnold.
We have Arnold press now.
No we centric [music] here.
Although I'm going to probably
just be controlled.
>> Four.
Five.
Six.
Seven.
>> Hey, yeah. Too easy.
Need to go up.
Plus,
we're going to go straight into our
supported T-bar row.
For that,
we go outside. Supported chest row,
supported
T-bar row. Uh, we're going to go a
little bit more neutral on this grip
here.
Let's appreciate how long this lever is
right here.
It means it's going to be really heavy
without a lot of weight.
>> [snorts]
>> I went up 25 lbs here.
I I love just absolutely always taking
over with my biceps, which is not a good
thing. It's just what I do. So, again,
it's kind of like on my bench press, my
elbows want to creep out.
On
this, my biceps want to take over. It's
kind of swallowing your pride. Shoulder
blades down and back.
A love-hate relationship with
the supported. Just feels like it
presses into your sternum. But, I'd
still rather do it over just a standing
bend over. Nothing sucks the air out of
you
like compressing your windpipe or your
diaphragm on a pad. But,
ooh, little Harvey, she absolutely loves
when I bounce my babus.
That's what she calls these, babus.
Instead of I'm going to throw a little
curveball on this. The workout calls for
supinated grip.
I need less of
a supinated supinated grip lat pull
down. [music]
I'm going to add in another low to high
row
for me, just a little bit more of a weak
area [music] training. Still same number
of reps, just different order. So, this
is a tri-set.
Uh, Poliquin raise or lateral raise like
we're doing
with this and dips for chest.
>> [music]
>> Okay.
Dips for chest.
Big thing this for chest, we want to
elevate the butt.
Chest comes over over top of the ground.
Try to be almost parallel with the
ground. You're not going to ever get
quite parallel. Who knows, you might.
But and then we're really using that
chest in a fly motion.
Up, butt. Oh, you know what? I got to go
this way. My butt's too big. I've been
squatting [music] too much. Here we go.
Up.
Like I said,
we got a little substitution going on
out here. Just making do with what we
have. Set of Poliquin raise. I've always
liked this standing lateral raise.
Um I like one where you can kind of
adjust the height or the foot. This
one's just kind of a stuff standard,
however tall you are. But it works for
me. Shoulder height. From here, I just
feel like I'm
throwing my arms out to the side. Not
going up. Traps will take over if we
start raising our hands higher than our
shoulders. So throwing it out to the
side as wide as possible.
>> [music]
>> Controlling on the way down.
>> [music]
>> It's almost like the first part.
Sit back into it.
And then squeeze.
>> This is the fun part. We got to do three
sets of 12 biceps and triceps. So,
biceps you got a Zottman curl. Just get
basically basic curl up, rotate,
supinate. So, we're we're supinating,
pronate on the way down, keeping those
elbows nice and tight. We don't want
them flaring out. No hip, no, you know,
leaning back or coming too far forward
and hip hinging. We don't want to be
throwing that weight up. And then
triceps, we got a rolling tricep
extension. So, we'll come down, instead
of pressing it back up as a skull
crusher, down, roll it, and then close
grip bench press it up. [music] So, go a
little bit heavier than normal than you
would for a normal skull crusher on
that.
Um
also have abs and running, but I will be
doing those at a separate time.
These workouts are long, they're
strenuous. If you need to, go to that
60- or 30-minute version. Or if you're
like me, I got to separate my core and
cardio later on in the day. So, I'll be
hitting that with Morgan later on
tonight. We'll be headed to the gym
together, a little couple's day.
Pretty happy with that first day on this
strength cycle on the program. Upper
body, we did
chest, shoulders, back, biceps and
triceps. Got core and running later on
tonight. But all in all,
starting to feel a little bit stronger.
Starting to feel my central nervous
system kind of feel like fire back up on
those bench presses, being able to
explode a little bit quicker. And that's
all because of the last 4 weeks and how
we've been training. So, we just need to
continue that. And hopefully we've
you know, hopefully we'll increase
30 to 40 lb easy on that max in that
time. I mean,
partly because I was there before and
just hadn't been training my central
nervous system for explosive lifting
while I was doing the Hyrox training.
So, it's good to be back in the gym.
See you next week.

## fitness app data model exercises sets reps

### Cómo crear una app de fitness con IA (proyecto real, no demo)
https://www.youtube.com/watch?v=n8vprs80578

[música]
[música]
[música]
Bueno, buenos días. Eh, hoy es 13 de
agosto de 2026. Vamos a iniciar con
nuestro curso de inteligencia
artificial.
La idea del día de hoy es mostrarle el
alcance de la herramienta, poder
mostrarles lo que logro y un problema en
particular que me está acusando hoy,
cómo lo podemos solucionar con
inteligencia artificial y si esta
herramienta puede ser válida o no. En
este contexto quiere decir que lo que
vamos a hacer hoy puede ser demasiado
avanzado, pero el objetivo del curso es
que puedan llegar a hacer estas cosas.
Entonces, vamos a darles el contexto del
problema. Eh, mi nombre es Dixon. Tengo
46 años, me gusta mucho hacer ejercicio
y me di cuenta que no llevo el progreso
de mis secciones eh debidamente. Sé
cuánto levanto en brazo, sé cuánto
levanto en pecho, sé cuánto levanto en
piernas, pero no sé cuánto levanto en
femorales, por ejemplo. Y ese
seguimiento ha hecho que el progreso eh
de pronto no haya sido muy eficiente. Lo
que quiero lograr con la aplicación de
hoy es poder gestionar mi progreso de
manera personalizada,
eh, basado en la ciencia
y eh que me permita realmente hacer un
seguimiento para poder evolucionar en
mis ejercicios día a día. Ese es el
contexto del problema. Con ese
planteamiento, entonces vamos a empezar.
Lo primero que voy a hacer es entrar a
Cloud Code, a Cloud, perdón, y le voy a
pedir que investigue a fondo las app de
ejercicios
existentes
en el mercado.
Aquí toma como referencia
el top 10 para que investigue las
mejores.
que es para que investigue las mejores.
Eh, cuando le digo que investigue fondo,
él debe investigar todo, pero de todos
modos le voy a decir cuál es la
intención de la investigación.
La intención
es crear
la mejor app.
Por esto es importante
que con que
veas todas
las funciones
funciones
de cada una
y cuál es
mejor y por qué y
eh
y por qué.
de cuál es mejor y por qué.
Luego
el siguiente paso es detallar
el diseño
de diseño
para una appalizada.
Eh, en este caso le estoy pensando en
que sea solo para mí, pero puedes
podemos
decirle que una
eh personalizada
para los usuarios
de mi
página web.
Entonces, aquí lo que le estoy diciendo
es eh que voy a tener unos usuarios y ya
no va a ser personalizada solamente para
mí, pero eh en contexto eso eh
importante, debes
solicitar
login
coma un perfil
del usuario.
un perfil del usuario,
eh,
y
un perfil del usuario y
todo lo
demás en el diseño. Recuerda que no va a
hacer nada, solamente el diseño.
Eh, ¿por qué lo por qué le estoy
pidiendo login? porque quiero que sea
una app segura. Y eh
ahora él va a pedir aquí en este momento
nos va a pedir eh
vamos a ponerle el más avanzado.
Lo queremos en chat, no en cowork porque
lo queremos hacer investigar. Y le vamos
a poner que
haga la investigación.
Quedó en investigación. Perfecto. En
opus y en alto para que nos haga una
buena investigación ahí. Y con base en
esta investigación es que vamos a
desarrollar nuestra aplicación web que
nos permita eh gestionar nuestro
progreso en el gimnasio.
Entonces, esperemos que nos haga la
investigación
mientras
Ah, bueno, mira, aquí nos empieza a
preguntar un par de cosas. ¿Cuál es el
foco principal?
Eh, mixto y general.
Eh,
en una web integrada al sitio solamente,
no la quiero como aplicación.
Eh, modelo de negocio premium con
premium, incluida con la membresía
actual.
con la membresía actual,
¿no? eh
para
para
todos
para todos los usuarios
que se registren.
Estoy escribiendo muy bonito hoy, así
que me perdonan. Tengo parece que
tuviera dislexia
usuarios. Listo.
Entonces,
y bueno, volvemos con la grabación que
teníamos desde la mañana, donde pusimos
a nuestro amigo Cloud a trabajar en una
app de seguimiento
del progreso en el gimnasio. ¿Listo? El
objetivo de esto es probar qué tan
fuerte es la inteligencia artificial y
qué tanto puede solucionar nuestros
problemas cotidianos. Esto transportas a
nuestra empresa donde tenemos tareas que
son mucho más repetitivas y de pronto
más controlables en temas de capace a la
hora de e evaluarlas. ¿Listo? Entonces,
vamos a ver qué ha pasado con Cloud y
que ha ido avanzando.
Eh, volvemos por acá.
A ver,
nos quedamos haciendo un resumen en
breve. Estábamos eh hicimos una
investigación,
una investigación de mercado,
eh perdón, una investigación de las apps
que están en el top 10 del mercado y de
eso cogimos las características y le
pedimos que nos detallara cómo debería
ser una aplicación.
Eh, para eso cloud tocó 12 puntos
esenciales y esos 12 puntos como tal se
los entregué a Cloud Code para que me
construyera este sitio. ¿Cómo está
funcionando? Eh, o cómo se empieza a
generar este sitio como tal. Hay un
plugin plugin plugin que se llama UI UX
Pro Max. Este plugin que está aquí eh
actúa como un agente
eh que se encarga de revisar todo el
proceso de la creación de una página web
o una aplicación móvil desde el diseño,
eh desde el diseño, el código, todo todo
lo que tiene que ver con eso. Si quieres
saber un poquito más sobre este plugin
en particular, eh, dónde lo puedes
obtener, háblame o te comento
cómo crear uno especial para ti. Listo.
Con este plugin, con este llamado este
plugin, lo único que le dije fue crea
una apprues.
A ver, si no llamas el plugin o no
tienes una etiqueta puntual de qué es lo
que tú quieres, él va a crearte una
aplicación web solamente diciéndole eso.
E crea una
app con las siguientes instrucciones y
le das todo el diseño que te creó Cloud
con eh
con la investigación pasada. Sin
embargo, tienes que tener en cuenta que
cuando llamos el plugin está jalando
todas las skills, por así decirlo, las
habilidades que tienen todos los
desarrolladores en una oficina eh de
este tipo de negocios. Entonces, ¿qué
hace? revisa bien el código, revisa el
diseño, revisa eh
congruencias, revisa un montón de cosas
que de pronto cuando se lo pide sin
llamarlo no va a tener en cuenta. Lo más
importante es que va a revisar la
seguridad de la aplicación y esto sí lo
necesitamos. ¿Listo? Entonces solamente
le di la como prom crea la aplicación
con las siguientes instrucciones y le
copié todo lo demás y él empezó a
trabajar, me hizo una pregunta eh como
estaba trabajando en una aplicación
parecida, que si quería esa o
empezábamos una nueva y que si además
quería la aplicación completa o quería
adelantos paso a paso. Para este caso
particular le pedí que me lo hiciera
completo y eh que fuera un proyecto
desde cero. Miren todo lo que empieza a
hacer. El mismo empieza a hablar y
auditarse él mismo en cada una de las
cosas que está haciendo, porque eh el
plugin que tiene hace evaluar cada
actividad que haga. Entonces, llegamos
al punto donde se comió los tokens, que
fueron donde nos quedamos hace 6 horas.
Recuerden que eran como las 10 de la
mañana cuando cuando conversamos en eh
temprano, se comió los tokens eh y
intentamos de nuevo a comenzar hace un
ratico.
Eh siguió con siguió con la creación.
Eh me hizo un par de preguntas más eh de
aceptar, aceptar, aceptar. Eh, les digo
algo importante, acaba de salir un
anuncio de Antropic, que esta parte de
aceptar de la forma humana los las
peticiones de lo que va a hacer cloud va
a ser eh puesta por default en que
continúe y solamente para usuarios que
necesitan revisar lo que están haciendo,
tendrán la opción de de tenerla
habilitada. Y eso debido a que e en el
estudio que se hizo cuando se puso ese
chulito de seguir o no seguir con Cloud
Code, se dieron cuenta que tenía muchos
más errores cuando nosotros los humanos
aceptábamos o no aceptábamos esa eh esa
responsabilidad o esa eh o esa tarea que
tenía que ser Cloud. Bueno, entonces eh
continúo revisando cada una de las
partes de la aplicación, el mismito. Eh
trabajó y trabajó y trabajó y trabajó y
luego me dijo por acá que esto era lo
que debía hacer.
Esta era la parte que debía hacer para
esta parte sencillamente entré al
editor, ah, perdón, al CMD. Escribí cmd.
Vamos a hacerlo aquí con ustedes.
Escribes CMD.
A ver, CMD
y les va a salir símbolo del sistema. Le
dan clica,
eh,
voy a volverlo a hacer aquí con ustedes
sin bajar el servidor. Entonces, me
pedía que entrara
directamente
a la carpeta.
Entro a la carpeta donde está la
aplicación que me está montando. Esto es
muy importante estar dentro de la
carpeta. Si no estoy dentro de la
carpeta, no me va a eh no va a ejecutar
esa aplicación, sino cualquier otra o va
a lanzar algún error. Y aquí en dentro
de la carpeta lo único que tengo que
hacer es escribir este comando. Con este
comando se va a abrir, mírenlo aquí, tal
cual va a escribir esto que está acá,
que es eh la aplicación como tal
y el
e
la ruta local donde lo puedo ver desde
el navegador.
A ver, aquí dice que si le doy control y
click,
control y click me lo abre. Perfecto,
aquí estamos dentro de la aplicación que
nos está creando dentro del local host
como tal. Vamos a empezar a revisarlo. Y
me dice, "Tu entrenador híbrido,
gimnasio,
casa y cardio en una sola app, gratis en
español y sin tiendas de aplicaciones.
Detalle que acabo de caer en cuenta, no
le pasé el manual de marca de la
empresa, por lo hizo con los colores lo
que quiso. Digamos que estamos pegando
en algunos colores y el naranja no me
molesta para el tema de
e
para el tema de Wow, me pidió acceso con
Google. Vamos a ver qué pasa si le damos
acceso con Google.
tratamiento, datos de salud,
comunicaciones comerciales,
si lo quiero,
analítica de uso, métricas para mejorar
opcional siempre vamos a ponerle que sí
a todo.
No me dio acceso con Google, entonces
vamos a ver, vamos a poner el nombre,
vamos a ver qué me pide.
Yo quiero ganar músculo, perder grasa. A
ver en qué etapa estoy. Yo creo que es
momento como de
mejorar resistencia. Eso es lo que
queremos hacer ahora. Y ganar fuerza.
¿Por qué ganar fuerza? Porque esto salió
desde el punto, desde la necesidad de
saber cuánto estaba cargando de peso y
de ver por qué no estaba avanzando en
cierta parte.
en ese tipo de orden, ya esas serían mis
tres prioridades y yo estoy en nivel
avanzado porque llevo más de 2 años
trabajando
en gimnasio. Me gusta ir al gimnasio y
puede ser al aire libre, ¿no? Pero no
quiero hacer cardio. ¿Qué dicen ustedes?
Entonces, solamente gimnasio para que no
me mande a trotar.
Gimnasio completo, tiene de todo, así
que me parece genial esto.
10 por semana. Miren, me deja
configurarlo con una barrita aquí. 5
días por semana y entreno 2 horas.
2 horas.
Muy bien.
Altura. Parece que me hubiera
pesado esta vaina. Me hubiera
medido.
Y estoy pesando más o menos 85 kg.
Eh, alguna zona que cuidar
el codo.
El codo. ¿Por qué me operaron el codo?
Y listo. Vamos a ver cómo crea mi plan.
Mi plan está listo. Vamos a ver cómo es
empezar con mi primer No, quiero ver el
plan completo. Vamos a ver qué creo esta
vaina.
Empujen.
Se empuje debe ser pecho. Todo lo que es
empuje es pecho. Tirón es espalda,
eh, carrera continua, pierna es cardio.
Wow.
Esto es para la semana uno. Para la
semana uno. 1, 2, 3,
4 cco.
Y entra. Bien.
Bien,
me creó la rutina.
Veamos a ver. Entonces, me pone aquí PR
de banca.
Puedo añadir bien, o sea, que no me
limita las series, pero con cuatro
series es más que suficiente. Puedo
añadir peso.
Sí, este es el peso. Entonces, el peso
sería
100.
por
Bueno, ya aquí tenemos el primer detalle
que no sé cuál es cuál.
Eh,
de eso voy a tratar ir probando, ir
revisando las cuestiones, pero miren que
aquí no tengo la etiqueta de si aquí es
el peso o es la repetición,
aunque al final para la cuenta es lo
mismo, pero me gustaría saber que tenga
las etiquetas puntuales de cuál es el
peso y cuál es la repetición. A ver,
todo esto está perfecto.
Wow, muy bien, muy bien.
Y puedo terminar el entreno,
entonces
puedo puntuarlo, guardar y salir.
Eh, se abre una pantalla completa al
instante que funciona sin conexión. No
quiero instalarla,
¿eh?
No quiero instalarla.
El entreno de hoy ya me dijo que era y
me dijo,
"A ver, esto sí me está gustando. Me
parece una aplicación bastante completa.
Bueno, entonces veamos a ver la
biblioteca de ejercicios.
La biblioteca, aquí están la biblioteca
de ejercicios.
Muy bien.
Eh, inicio entrenar.
Me está dando los eh este es el
siguiente que debe ser el de mañana.
Este es mi plan de ejercicios de la
semana. Y en entreno libre puedo añadir
ejercicios.
Eh, terminar entreno, descartar entreno.
Listo. Entonces, progreso. Ya sabemos
que no hice nada hoy y mi perfil
me quedó que tengo limitaciones en el
codo.
Mejorar resistencia. Gimnasio completo.
Repeticiones que te quedan en el tanque.
Perfil público. Chévere. Si lo quiero.
Bien.
Inicialmente esta app está bastante
completa y digo inicialmente porque eh
vuelvo y digo, el objetivo era poder
crear una app que me permita gestionar
mis
eh
ejercicios.
Yo solamente le pondría dos cosas a esta
aplicación para que funcionara perfecta.
Una es que me me permite personalizar mi
rutina de ejercicios, eh, porque me la
creó por default. Yo nunca le dije que
me lo hiciera así, sin embargo, me
parece genial que me haya hecho toda la
rutina completa de la semana, si no
tengo que pensar en eso. Eh, y lo otro
que le pondría es realmente
nada, ya
nada, ya, solamente eso, con que le
pueda poner los ejercicios
personalizados.
Eh, sería feliz. Veamos a ver para ver
este siguiente a ver si lo puedo
personalizar.
Ay, claro, lo puedo cambiar, entonces no
hay ningún problema. Aquí está la rutina
completa. Me la app está totalmente
completa. Me falta solamente
solamente el tema de la
eh del login. Vamos a ver qué me dicen
acerca del login. La skill devolvi
fitness app. Bla bla bla.
Acceso
MVP completo. Más adelante lo que
pediste. Acceso con mail, contraseña.
Confirmación Magic Link.
Back end en simulado. Perfecto.
Cons sentido data onboarding. Perfecto.
Motor de rutinas. Verificando el
navegador. Recorr el flujo completo.
Confirmado. Bloquea las obligaciones.
Filtro de elecciones. Hombro. Perfecto.
Eso está bien.
Eh, cinco fallos encontrados ya los
corrigió.
Imitación honesta. El registro del
servir Walker no puede probarse porque
el naveor bloquea la descarga del
script, el código y el manifiesto.
El registro del service Walker
recoge lo pendiente antes de lanzar el
back en ISO real.
IP de consentimiento desde el servidor
revisión de ley política es plantilla.
Listo. Por eso es que no lo puse con
Google. Listo. Pero entonces a mí no me
interesa realmente que esté con Google
porque lo que quiero es montarlo dentro
de mi
eh
dentro de mi servidor, dentro de mi
página web. Sin embargo, este era el
objetivo. Eh, y hasta aquí llegamos. el
día de hoy. Espero que les haya gustado.
Eh, de aquí en adelante la intención es
que vayamos avanzando cada vez más
despacio, de cero a más.
Eh, en ese sentido si vamos a empezar a
explicar cómo se pronuntea, eh, cómo se
hace un agente, cómo se conecta un
plugin,
cómo eh
nos conectamos a otras aplicaciones
y cómo podemos crear una aplicación ya
robusta como esta que estamos viendo,
que eh realmente está bastante
interesante. Vuelvo y digo, esta es una
aplicación gratis, eh, que si la vemos
en el teléfono debería verse muy bien,
muy parecida a las aplicaciones
comerciales que están aquí. Ventajas o
desventajas, pues ya habría que probar
la aplicación a detalle, eh, y ver
en qué cambia. Me gusta, de verdad, que
me hizo la semana, que me hizo el plan
completo de la semana. Eh, si no tengo
la experiencia, pues es muy chévere
porque esto me lo me lo me lo facilita.
y sí me permite crear mis ejercicios.
Así que genial, chévere.
Recuerden
seguirme,
seguir el canal y veamos a ver cómo
vamos continuando
a crear nuevas aplicaciones y nuevos
sistemas para ustedes. Yes.

### Fit4i vs. Traditional Fitness Apps: Which Is Better?
https://www.youtube.com/watch?v=l7-hFYG31l0

[music]
Oh yeah. Oh yeah. Oh yeah. Oh
[music and singing] yeah. Oh yeah. Oh
yeah. Oh yeah. Oh yeah.
Hey there. What you drinking? Two shots.
Let's [music] pour it out. I know what
you're [singing] thinking. H but
tomorrow won't come for us. This life
that we're living ain't never [music]
going to give it up. Double shot for the
gifted. One more for us. There
[music and singing] you go. Drink it up.
All this love in a cup. Yeah, we go
slow, we go fast. Yeah, we can't get
enough. We stay all [music] day, all
night. Living in paradise.
Remember, you don't get it twice. The
time of your life.
[music]
This is the time of your life.
Remember,
you don't get it twice. [music]
The time of your life.

## personalized workout plan generator app

### How AI Builds Personalized Home Workout Plans That Actually Adapt
https://www.youtube.com/watch?v=q6LdP19OaVs

Artificial intelligence is changing how
home workouts are designed. Instead of
static routines, AI systems analyze your
performance data, recovery patterns, and
available equipment to build a plan that
evolves with you. These platforms use
machine learning algorithms to adjust
exercise selection, sets, reps, and rest
periods based on your feedback and
progress. For example, if you log a
tougher session, the AI might increase
intensity or suggest a new variation.
Conversely, if your form metrics
indicate fatigue, it can recommend
lighter days or mobility work. This
adaptive approach mimics a personal
trainer's intuition, but scales to
anyone with a smartphone. The result is
a workout routine that stays challenging
yet safe, and crucially, keeps you
engaged by avoiding plateaus. Whether
you're a beginner or experienced, AI
helps ensure every session counts toward
your goals without needing a gym or
expert guidance.

### How AI Creates Personalized Workout Plans That Adapt to You
https://www.youtube.com/watch?v=PTCSQlQNEUk

Artificial intelligence is reshaping how
people approach fitness by generating
workout plans that adapt to individual
needs. Instead of generic routines, AI
models analyze user data like fitness
level, goals, available equipment, and
recovery patterns to create customized
exercise sequences. These systems often
use reinforcement learning, adjusting
recommendations based on performance
feedback, and even biometric data from
wearables. For example, if a user
struggles with a particular exercise or
reports soreness, the algorithm modifies
future sessions to reduce strain or
target different muscle groups. Some
platforms also incorporate natural
language processing to interpret user
preferences or injuries shared in plain
text. The result is a dynamic plan that
evolves over time, mimicking the
attention of a personal trainer without
the cost. As these models improve, the
line between automated guidance and
human coaching continues to blur.

### The BEST Fitness App Just Got Even Better? \\ Jefit AI Adaptive Plan
https://www.youtube.com/watch?v=9-l8V435qk8

So, most workout apps just log your
lifts. They don't tell you what weight
to use next week or what weight to use.
Jefit's new adaptive plan does exactly
that.
So, finally, we have an app that
actually adjusts your weight and reps
based on your performance. So, this
means it takes out all the thinking out
for you based on your previous
performance last week. And it will
automatically increase or decrease your
weights and reps. So, in today's video,
we are going to review the entire
process and what it actually looks like.
And as a former provincial powerlifter
who also reviews health and fitness
products for a living, let's see if it
lives up to the hype and if it's
actually worth it for you. And if you're
new here and you enjoy honest fitness
app reviews, a like and subscribe would
mean a lot and we have tons of things on
fitness track as well. So, when you set
up the adaptive training plan, just like
any other fitness app, it's going to ask
you a ton of questions to create a
proper personalized goal for you. Now,
in my example, my main goal is going to
be cutting because it's summertime. And
it's going to ask you what your fitness
level is and how many days you want to
train, the length of each session, what
type of gym and equipment you have, and
of course, muscles you want to target
specifically, along with any injuries
you might have had in the past. Now,
once you enter all that information, it
creates a workout plan for you
automatically. Now, before we get into
the workout themselves, the top part of
the section shows you a progress bar for
your adaptive plan. Now, what I love
about this is that how it closely mimics
proper training cycles. So, whether that
is periodization or the kind of
mesocycle structure that coaches uses
for powerlifting or bodybuilding, Jefit
does it right where it breaks it down
into four different phases and this is
what the first cycle will look like. So,
first, you get the on ramp, the on ramp
bridge, the accumulation, the
accumulation bridge, intensification,
and then a deload. And for me, this
makes a lot of sense considering the
first cycle is something you want where
it's super light so that you can build
momentum going into the program. And
honestly, this entire process is pretty
much exactly how my own personal
training goes. And the crazy thing is is
that I've actually paid hundreds of
dollars for a very similar type of
building program. So, it's really nice
to see this on an app. Now, this is
where the adaptive plan gets very
interesting. It's going to start by
producing you the perfect workout plan
based on the questions you answered
previously. Now, for me, this is what my
program looks like, and this is pretty
good considering the fact that I only go
to gym about four times a week. Now, if
you click on a specific workout, you
have to change any one of those
exercises you don't like or maybe you
want to avoid. And the best part is that
if you do end up changing exercises, it
gives you a ton to pick from which still
work that exact same muscle. So, you
don't need to guess or really spend time
thinking about what exercises you need
to replace it with. Instead, you have
predetermined options, and all you have
to do is choose from them, which is
ultra convenient and super intuitive.
Now, we are going to go through every
single exercise in my entire program
that G-Fit has built for me, but what I
do want to show you is what the first
couple of phases and cycles look like
for me personally. So, in cycle one,
phase one, on day two, you can see that
it is upper leg and abs day. So, we have
a list of exercises, but for this video
today, we will just focus on the barbell
squat. Now, on this day specifically,
G-Fit advises me to do 275 lb for about
four to six reps, which is perfect and
light enough for me, especially when we
think about building momentum for the
entire week and program. Now, if you
fast forward to the intensification
cycle, we can see that it would
automatically up my squat for about 5
lb. And again, it still gives me a rep
range to work with. And honestly, when I
saw how closely this matched to what an
actual coach would program for me, I was
super surprised and really pleased to
see an app actually execute. And
honestly, this is pretty much exactly
what my powerlifting programs look like
when it came to building a mesocycle
structure. Now, you might be thinking,
what if the weights and reps were too
easy that did more than what was
recommended? If that is the case, the
app and adaptive plan would
automatically and intelligently adjust
your plan in the future based on your
previous lifting, which is a super
awesome and amazing feature for anybody
that goes to the gym regularly. Now,
there are a couple of things that I want
to note. If you're already using JFit or
maybe you plan on signing up, your
adaptive plan is going to look
completely different than mine. But,
when you do start using the adaptive
plan, you'll notice that from your side
that your workouts will get released
weekly. So, that means you will be able
to view everything like I can, but I
think it's actually a pretty cool
feature because at least it gives you
something to look forward to weekly when
you go to the gym. So, here are my final
thoughts. I already love JFit and the
data that provides for lifters. It just
does such a great job of making your
lifting data actually meaningful and not
just an app where it's a rep tracker.
But, the best part is that it puts that
lifting data into perspective for you.
So, it lets you know whether you're
overtraining or undertraining a certain
muscle. But, now with this new adaptive
plan feature, I feel like the value for
this app have just jumped a ton. Now,
personally, I've never paid for a coach
or a trainer back in the day, and
because I haven't, I really wish I had
something like this, like an app like
JFit who could do that for me. So, not
only give me a proper lifting plan, but
also insightful data to learn a thing or
two about lifting and help me actually
perform at my very best and improve. So,
if you've never had a proper training
plan, this is the closest thing to
having a coach without actually paying
for one. With that being said, recommend
JFit. I think it's perfect for everyday
gym goers who go to the gym regularly.
So, if you are interested in signing up,
I'll make sure to leave a link in the
description for you. Now, the app is
actually free to use minus a ton of
other features, especially the adaptive
plan, but you can also use the JFit free
trial version as well to test out if
it's actually for you or not. And of
course, I've also done a full review of
the JFit app, so make sure you check
that out if you haven't already to know
everything that's in the JFit app. Guys,
thank you so much for watching this
video. I really appreciate it. And make
sure you check out some of my other
videos. I do a bunch of reviews on
fitness trackers and fitness apps and
everything health and fitness related.
And I think there's a ton of value for
you. So, make sure you check those out.
Catch you guys on the next one. Peace.

### This FREE  Website Creates Custom Workout Plans in Seconds!
https://www.youtube.com/watch?v=u67yfYajyKo

Hello everyone, welcome back to my
channel. This is Tech Summoner, your
go-to channel for discovering amazing
websites, AI tools, and technology that
makes your [music] life easier. If you
have been looking for a simple way to
create a personalized workout plan
without hiring a personal trainer, then
today's website is for you. Today we're
going to be looking at a website [music]
called workout.cool,
a free AI-powered fitness website that
helps you to generate customized workout
plan [music] in just a few clicks. So,
let's check it together. Workout.cool is
an online fitness platform that uses
artificial intelligence [music]
to generate workout routine based on
your personal goals. Whether you want to
lose weight, build muscle, improve your
endurance, or simply stay active, the
[music] website creates a workout plan
tailored just for your needs. The best
part, you don't need to download an app
or spend hours researching exercises.
Everything happens directly in your web
browser, making it quick and convenient.
[music] The website is clean,
beginner-friendly, and easy to navigate.
One of the standout feature is its AI
workout generator. You simply answer a
few questions such as fitness goal,
experience level, available equipment,
and
>> [music]
>> how many days you want to exercise each
week.
Within seconds, the AI generates a
structured workout plan designed
specifically [music]
for you. Another great feature is
whether you are working out at home with
no equipment, using dumbbell, or
training in a fully [music] equipped
gym, the platform can create a routine
that match your available resources. The
workouts are organized clearly, making
them easy to follow even if you are new
to fitness. [music] Because everything
is generated based on your preferences,
you can experiment with different
workout [music] style and adjust your
plan whenever your goals change. This
make workout.cool useful for beginners,
intermediate users, and even experienced
fitness enthusiasts looking for new
ideas. Workout.cool [music]
is ideal for beginners starting their
fitness journey, professionals who need
quick access to [music] workout plan,
students looking for free fitness
resources, workout enthusiasts, gym
goers wanting free fresh workout [music]
routines. Remember, while AI help create
workout plan, it's always important to
exercise safely, use proper form, and
consult a health care professional
before starting a new fitness program,
[music] especially if you have a medical
condition. If you're looking for a fast,
free, and easy way to build a
personalized workout routine,
workout.com [music]
is definitely worth checking out.
If you enjoyed this review, give this
video a like, subscribe to Tech Sis with
Samuel, and don't forget to share with
friends and family. And I'm going to see
you in the next video. Peace.
>> [music]

### TPG — The Plan Generator | Smart Gym Kiosk, App & T_Block Wearable
https://www.youtube.com/watch?v=UneOaLfYfWg

Are you scared of injuries in a gym?
Don't be. We are here for you.
Let me explain.
Maybe you are a pro, intermediate, or
just beginner like him.
It really doesn't matter.
Don't be confused. You just stand there
wondering how to do it, what to do it,
and how much to do it.
Sometimes you are just lost in a gym.
But not everyone is lost.
Sorry, bro.
Some of them know exactly what to do,
how to do, and how much to do.
He doesn't check in, sign in, or log in,
or anything. The plan is just ready for
him.
Today's session was ready before you
walk.
And yes, same plan, same ecosystem,
already in his pocket.
And nobody counts anymore.
It's so simple. Just snap it and use it.
Easy to use, easy to install. A Chaos
app, a wearable,
the whole ecosystem. It follows the
member, not the gym floor.
Here are some glimpses.

## progressive overload tracking app

### Body Stats Tracker App | Track Your Complete Fitness Progress
https://www.youtube.com/watch?v=72bkGX9hd0s

Hey, Justin with Pumpal here. And if
you're looking for a body stats tracker
app, you found the right video as Pumpal
combines workout tracking with tracking
your body stats. Um, we have a couple
cool features in it. We have progress
photos, which allows you to track your
um, front, side, and back shots and
compared them from your previous photos.
So, you can visually see your changes
over time. We offer body measurements um
which allows you to quickly record your
body measurements and then track those
over time and compare them to your first
measurements. There's all kinds of cool
little features we have in Pump Pal that
are free to use and allows you to track
your body stats. Um in this video I'm
going to kind of go over all the
features. I think we'll start with body
measurements cuz I think it closely
aligns with what you're looking for. Um
tracking your body stats. We'll go into
progress photos and then show you that
the workout tracking and the
reasons features and all the different
features. Um, if you want to follow
along with the video, um, go to your app
store, search for Pump Pal physical
activity logs. Um, download, install it,
and you can follow along in the video to
kind of watch what you can do.
Otherwise, you can just watch the video
and just check out everything it has to
offer and see if you like it. Otherwise,
let's go ahead and get started on body
measurements.
Okay, so let's check out body
measurements. So, what is body
measurements? It's a way to keep track
much like progress photos um of your
progress over time without the scale
being involved. Although we do take the
scales measurements in measurements, um
there's many more things we keep track
of besides just the overall weight. Once
again, if you ever have an issue where
you went a couple weeks, maybe you're
trying to gain weight and you're maybe
you're stuck at like 200 lb, didn't gain
any weight for a couple weeks, or maybe
you want to go down, you've been stuck
at 200 lb for a couple weeks. Um, and
maybe even in progress photos, you might
not have seen your progress, right?
Visually, you can't see it. Whereas
measurements is a bit more precise. So
maybe you won't see in the the progress
photo, it's a tenth of an inch change as
opposed to in a measurement you will.
So, if you don't know how to take proper
body measurements, on the top we have
tips, tools, and recommendations. Inside
there, it'll give you all the
recommendations and tools you might want
to use. Um, when you should take the
measurements, all kinds of good stuff is
inside there if you want to take a look
at that if you want the best possible
measurements. If you're not sure where
to measure, um, you can hit click the
show measurements picture and it will
show you a diagram of all the different
places you can measure, right? And I
would say be sure you're measuring at
the thickest point. Everyone's like
everyone's body is built a little
differently. Like my uh peak on my arms
is generally closer to my deltoids. Um
and like the difference is almost an
inch, right? So like if I do like just
the dead center of my biceps, um it's at
16.1, but if I do it more towards the
top in between that center point uh and
the deltoids, it's 17 in. So everyone's
a bit different. Some people peak, you
know, their bicep peak towards more so
the center. Some of them are spread out
a bit more. Um, so find your thickest
point in all these diagrams. So don't
take it to heart with the left thigh
where it's pointing. It not might not
necessarily be your thickest point. So
just find your thickest point and that's
where you want to measure. Just a heads
up on that.
Okay. So going back to the measurement
screen. So essentially um whenever you
take your first measurement um the app
will remember your first measurement.
You can't delete the first measurement,
but you can edit it just in case you
made like a measurement uh error or
something like that. you can go in and
change it. Otherwise, if you want to add
a new measurement on the top right, you
can hit that plus button and it'll bring
you to the measurement screen.
Inside here, you can then take in your
weight, you can take in your body fat
percentages, um you can take in your
waist, your hips, your chest, your neck,
your left bicep, your right bicep, um
all the different measurements that uh
you can take, right? And then you want
to just hit save and it'll add it to
your list.
And over time you start to collect a lot
of measurements. And then you can also
compare those measurements to your first
measurement. On the top right you just
hit that compare button
and
you'll have your measurements. Um this
one has a change in your weight. You see
a green line. Um I think it kind of
follows only right now. It only follows
like if you are
trying to lose weight. Um, I think I'm
going to add into your account section
what your goals are at this point. And
then based off those goals, um, we're
going to have it show certain
measurements being good or bad. But
right now, it's kind of based off of
losing weight. Most people are trying to
lose weight in general or try to cut
down so they look, you know, more
ripped. So, it's kind of defaults to
that. Um, but let's say like um if
you're trying to lose weight, you've
been stuck at 225 um for a couple weeks
and then you looked at your progress
photos, you didn't really see much
change, but then you come in um in here
and you maybe you had, you know, tenth
of an inch come off your waist or a
quarter inch come off your waist or
maybe your arms got bigger, so your
weight didn't change because you
actually put some muscle on your arms
or, you know, maybe your body fat
percentage changed even though that uh
the scale didn't change, right? So here
you can see the changes being made um
visually and a bit more precisely than
you would in progress photos. You should
be taking both cuz then you have nice
pictures. You can see it and then you
can if that for some reason you don't
see it in that you can maybe see some
changes in here to keep you motivated to
keep going. Body measurement is a cool
feature in pump and you should
definitely check it out and make sure
you're getting your measurements in by
the recommendations.
Okay, so let's talk about plans. So,
what is plans? This is going to be like
the main place you're probably going to
be at most of the time when you use the
app. This is where you actually make the
plans for your workouts and you actually
go into your workouts and adding
exercises to your plans and things like
that. Um, the way this is built, we have
it set up um to where it's the plans
list is for the week. Um, so you're
planning out your whole week of what
you're going to do for your exercises
and then, um, you would repeat that week
after week after week, right? Um, as you
can see here, I have three plans. Um,
they're like at home full body workouts.
Um, I have four exercises in the first
two and then one at home. Uh, one
exercise for the third one here. Um, if
you wanted to make a plan, um, and you
know kind of what you're doing and you
want to make a plan, you can add a
custom plan by hitting the plus button
in the top right.
Um, and it'll ask you
to set up the plan's name and what day
of the week you're going to do the plan,
like so. Um, so you give it a name, you
know, maybe you're doing like leg day,
you might want to do leg day, um, you
know, chest day, whatever it is. Choose
which day of week you want it, and then
you hit add plan.
and it'll add it to your list. Um, if
you're someone that doesn't know quite
right, you know, at the moment of how to
set these exercises up, um, you can use
your free plan builder on the bottom
there, that, uh, build a new plan
button. If you select that, it'll guide
you through setting up a plan, um, based
off of the answers you give it. Um,
it'll ask you a series of questions.
Just kind of go through the list and
answer the questions. Um, and then it'll
eventually get to the point to where it
generates up to three plans for you like
this. Um, and you can kind of choose
what you want. You can see like this is
like a setup for someone that's doing a
at home workout. Um, they want to hit
their whole full body and it's giving
you 3 days a week. Um, and you can
simply select the plan that you want to
do, right? And then you hit use this
plan and it will add that to the list of
plans. That's a super cool feature
that's normally a paid ver uh feature in
most apps, but in this app, you get it
for free. So, do take advantage of that
while it's still free and check it out.
But yeah, um so if you want to go ahead,
let's say we created a plan and we
wanted to add exercises to the plan, all
you would do is you just hit select, you
know, whatever plan it is for that week
and you would then go into a screen
where you can add exercises.
Um, let me find it here quick.
So, this is a current list of exercises
within your plan. Um, if you wanted to
add another exercise to it, um, you can
add exercises to the custom plans that
are built the plan builder. You can
remove exercises from them, too. So,
don't think you can't modify it once you
add a plan. Um, you can do so whenever
you'd like. Um, so this one, we can hit
add exercise
and then it'll show you a screen like
so.
And you can add an exercise. So, in this
example, it's body weightight squats. It
could be, you know, regular squats. It
could be whatever exercise you like.
When you hit and you you start typing in
that section, it'll show you a list of
pre-builtin uh exercises also that you
can go ahead and select. Um what the
alternate is. Alternate is let's say
you're setting up your exercises. And
this allows you to swap within the
workout, you can swap in and out of a
alternate exercise. This is handy if
you'd like to do variations. Sometimes,
maybe every once in a while you want to
do dumbbell flies instead of the bench
press, you can use swap for that. Um,
the main reason that I would have an
alternate exercise is that if I'm at the
gym and let's say I'm doing squats and
all the squat racks are being used up,
um, I don't want to wait around 15
minutes for the squats to be um to free
up, right? A squat rack to free up. I
can use my alternate to do something
else. Maybe I'll just do dumbbell
squats, you know, high volume or uh
maybe, you know, what do you call them
again?
The leg press. You can do that. Whatever
my alternate is going to be, I'll have
that alternate in there. And you'll see
later on when we go into how what it
looks like when the workout's happening,
um where you can swap it out between the
two. And what's nice about that is it's
going to remember whatever you did on
that swap, so you can still kind of see
progress as you're moving forward. So
definitely check that one out there.
um add that in and then you simply hit
add, you know, add your sets and how
many sets you want. Like most people do
three, but you can add as many sets as
you'd like for the exercise. Um just so
you know, by default, it's going to give
you on the alternate exercises, if you
put in three sets for the body weight
squat, it will then automatically add
three sets in for your alternate
exercise, too. Um and then when you go
to swap it for the first time, it'll
just have zero for the weight, and then
you just add whatever weight you're
doing for the alternate. But yeah, and
then just below there, you don't really
see it in the image, is where you have a
save exercise or edit exercise,
depending on what you're doing. And then
that's where you'll get added to your
exercise list
like so. So, if you wanted to get into
the exercise, right, you just hit start
workout and then you'll be brought into
that exercise, right? Or that um to
begin your exercise. Um, and you look
something like
um
this.
Okay. And then here is what it looks
like within the exercise. Um, you have
your, you know, what exercise you have
to do first. It goes in order what that
list is. You can drag and drop them and
change order if you want to, but it goes
in that order. And then you can then see
here, you can add in the weight you did,
how many reps. Um, it has the little
rest timer. get rested for 60 seconds.
Um, if you did 225 12 times, um, your
one rep max will be around looks like
324.
Um, but yeah, and then you hit save and
then you the rest time will show up.
It'll play a sound and then you can go
into your next set, right? Um, as you
can see in this image, um, you have that
swap button in the top right. That's
where that alternate exercise comes into
play. Um, let's say you want to
alternate between, you know, body
weightight squats to lunges. you can
have a swap option there. Um let's say
like in this exercise you would have
like uh you know you know weighted
squats or barbell squats, right? Um you
can then swap two body weightight
squats. Maybe one day you want to do
lighter weights, but it's your way of
alternating between whatever you chose
to have as your alternate exercise for
that. I'm going to simply you keep going
through this list and then if you
complete the sets after you complete
sets it'll go into the next exercise.
So, maybe it's push-ups next or whatever
it is that's in your list. And then
eventually you'll get done with your
exercise and they'll give you a workout
summary and give you all kinds of
information about your workout. Um,
that's how the plans work within Pump
Pal. So, your plans are your your days
pretty much your days of the week.
Inside your plan, you have exercises and
then you can add more exercise, add
those exercises. Those exercise have an
alternate exercise and you start your
workouts from the plans.
So, as you notice here on the top, we
have those two tabs. We have the plans
list and then we have the groups list.
What is the groups, right? Um the groups
are a way to keep um your your list
organized. Let's say like you you found
one workout you liked, you did that for
6 months, um and you wanted to try
something new. Um normally you didn't
want to get rid of and you don't want to
get rid of those, right? Maybe you'd had
to write that down in a notebook and
then you delete them from here. Or maybe
you just added the new thing you're
going to do. Now you're starting to get
these huge list of items. Well, instead
of going with all that big list, you can
go with groups, right? Um, if you look
on the top right, we have that groups
folder on the plans list. If you select
that, that'll actually allow you to
group whatever's in your plans list and
put it into a group for later use. So,
if you go inside here and you click that
button, you'll be prompted with this
here.
Oops, sorry, wrong window.
Um, you'll be prompted with
I think I have it in a different folder
here. One second.
Yeah, there we go. You'll be prompted to
ask you, I remember when I was building
this, I was like, do I want to assume
they want them out of the list? I'm not
going to assume they want to remove that
from the plan list. So, I gave you an
option here. You can go ahead and decide
if you want to keep the plans you
currently have in your plans in the
plans list. So maybe you just want to
group them but you're still going to do
the exercises, right? Um you can just
say keep them in your list and then you
can then add a group for those items. Um
you remove your plan or you can remove
the plans from the list. Let's say you
know you're done with this plan these
plans for the week. You can then remove
them from the list and group them as you
might want to use that group of
exercises later on. Maybe four or five
months from now, 6 months from now, a
year from now. You can group those
together for later use. Um, and then
once you do that, you're going to be
into the group screen where you have
your groups, right? Um, and then if you
want to make a custom group without any
plans, you can hit that plus button.
It'll go through and add, you know, ask
for a name, description of the group,
and then you can even make custom plans
within those groups that you've never
done before if you wanted to. But I
believe most people are just going to
have, you know, their plan set up. Um,
you're going to hit that group button.
You can save them for later. Um, but
let's say like six months down the road,
um, you saved this at home workouts in a
group and you want to go back to that,
uh, exercise group, right? Um, you can
delete the plans in your plans list or
you can regroup those up and remove them
from the list. However you want to do
it, you can do then you just add this
group to your plans list. If you select
it, you'll be presented with this screen
here
and it'll have these exercises. So, I
remembered your plans and that you put
in that group and then you just hit the
the button add group plans to plans list
and then it will send those over to your
plans list where you can begin using
your plans again
here.
So, groups is just a handy way to keep
organized pretty much. Um, let's say you
found a cool leg exercise you really
like. You want to grow your legs. Um,
you found a cool plan online or maybe
used the plan builder. it worked really
well for you and you want to save that
for later, right? And you don't want to
get rid of them because it was a good
plan and it did what it's trying to do.
Maybe you wanted to grow your legs,
maybe you wanted your legs stronger,
maybe you want your chest stronger. Um,
it did its purpose and then you can mark
it down as, you know, chest progression
description, a program that worked well
to grow my chest. And then you can group
those together and later on come back
and use them. But yeah, that about
covers the plan screen and I hope you
enjoyed it and check it out.
Okay, let's go ahead and take a look at
reasons. So, what are the reasons? Your
reasons are the reasons why you should
be continuing to work out, sticking to
your diet, um these are here to help you
stay motivated. A lot of times when you
first start working out, um you have
huge motivation, you're all excited
about it, and you know, a few days start
to go by, a week goes by, and that
motivation begins to fade, right?
Because this is something that takes
time, years if not um for the rest of
your life is the current I mean should
be your goal. A healthy lifestyle,
right? So whenever that motivation
fades, you make a list of reasons why
you should keep going. And you can
always come back to these, excuse me,
and read these and keep your motivation
up. It could be a multitude of reasons.
Build strength. Maybe you maybe you just
got broke broke up with your girlfriend.
Now you're trying to look for a new
girlfriend. You want to look better.
It's easier to date that way. or vice
versa if you're girls. You want to look
better for dates. Um you want to stay
healthy as you age. There's a million
reasons why someone might um want to
continue working out and continue a
healthy lifestyle. I had reasons almost
every day as I think of them and I
review them um whenever I'm feeling not
motivated to go to the gym, read them
over, get my motivation back and then go
to the gym. Or even if you're going to
cheat on your diet and you know you got
you can be cheating on your diet, read
your reasons and it helps you get
reotivated to keep going. If you're not
sure on which reasons you should use, we
do have a presets option here and you
simply go through the presets. You know,
you can build strength, lose weight,
improve mental health, increase energy,
um doctor's recommendations, be a role
model for your family, um perform better
in sports, and gain more confidence,
right? Um, and there's there's
multitudes of reasons more. Maybe you're
a competitive person. You can put in the
reason why you're doing it because you
want to beat your beat your brother at
the weight loss game. Maybe you're in a
contest or whatever it is. Um, you want
to put your reasons here so you always
have a place to come back to reread your
reasons. Get that fire back in you and
keep going.
Okay, let's talk about the lifetime
access here. Right now, we're running a
promotion for a limited time. um where
lifetime access is only $39.99. It's a
great price for lifetime access. Most
workout tracking apps will charge you
upwards of 150 to 200 for lifetime
access. Right now, as we're new and
trying to grow, we're offering it at
$39.99 to our newest members. Um so, a
great deal to take advantage of. I'm
thinking this is going to change
probably by the end of the year. And
take advantage it while you still can.
So, what do you get out of that lifetime
price? You get no ads. So you no longer
get bugged about the ads. No ads in the
bottom. Um an ad free experience. Um
you're grandfathered into all feature
features. So for $39.99, every time I
add a new feature, you can rest assured
you're going to be able to use that
feature. Um you get a one-time payment
just the $39.99. And once again, it's
limited time. Um like I said, I'm
thinking right now we got we got quite a
few features now. So I'm thinking by the
end of this year, we're going to add in
subscriptions. And then once we add the
subscriptions, that lifetime price is
going to go up. Um, you can also sync
across your devices. So if you have a
phone or a tablet and you sign into both
of them, all your data will sync
together seamlessly. Um, also if you
ever get a new phone, a lot of people
don't think about that is then once you
get your new phone, you can simply sign
in your account and all your data from
your uh previous phone will just be
synced to your new phone. Definitely
give that a chance and check it out. um
it'll help support and help me grow this
app and get you more features.
Okay. And let's talk about the feedback
option. The feedback option lets you
come out and communicate with me um
directly and maybe you have like a
problem in the app I'm not aware is a
problem. You can let me know about that.
On the top there you have the problem.
Be sure to select the correct option.
Problem is going to put it to the top of
the list whereas suggestion is going to
put the suggestion um towards the bottom
of the list. So, if it's a problem, be
sure to select that one so I'm aware of
it and try to get it fixed as soon as
possible. Um, I do try to reply within
24 hours, whether it's a suggestion or a
problem. Um, so do give me, um, the
proper selection depending on what you
have. Um, but overall, I love feedback.
Um, even if you go into the app and you
don't use the app, um, end up using the
app, um, give me some feedback. Why
won't you use the app? I want to make an
app people want to use and stick around
with for years. Um, so feedback is
awesome. Like I said, I'll reply to you
within 24 hours. If you have a new
feature request, definitely send that
out to me. I have a list of features. A
couple of people's ideas are pretty
cool. Definitely love to hear that
feedback. So, definitely show shoot that
out to me whether you use the app or
not.
Okay, you've seen all the cool features
you can have in Pumpal. They're all free
to use. You got your plan builder, you
got your plan, you have your body
measurements, you have your uh progress
photos, you got your reasons, all kinds
of features inside uh pump out to track
your body stats. Um and they keep you
motivated to keep going. Um be sure if
you have an idea for the app to reach
out to me in that feedback section. Be
sure for sure if you're having issues um
in the app um to reach out to me in that
feedback section again too as there may
be a problem um that I'm not aware of
and I can get it fixed for you. Usually
I'll get it fixed within 24 hours. I
just had someone actually uh let me know
that I didn't realize on the Apple side
of things when you're inside there. The
music wouldn't play. You know, when
you're listening to music and you're
tracking your workouts, when the rest
timer went off, it stopped your music
and then you had to replay your music
every time, which would be annoying.
Luckily, someone told me and I figured
it out and I fixed it. Um should have
been an update that was in yesterday. Um
but yeah, definitely let me know if
something's wrong. Um sometimes, you
know, my testing I don't catch
everything. I don't realize it. give me
that feedback. You can give me the
feedback on the app side and you can
also go to my website
pumppoworkoutscul.com.
Maybe like for some reason you can't get
in the app. Um, submit feedback there
too so I can get notified and figure out
what's going on. Otherwise, I think I
kind of covered everything I want to
cover. Um, be sure to like and subscribe
to this channel if you like this kind of
content or want to keep up with Pump Pal
and its new features as they come out.
Um, otherwise I covered everything and
you all have a good day. Thanks. Bye
now.

### Ditch the Gym Notebook: Best Apps for Progressive Overload | IZEM AI Fitness Coach
https://www.youtube.com/watch?v=JSdAB3O6jxk

Welcome to the Explainer. Today, we're
ditching those messy gym notebooks for
automated progressive overload. We've
all been there, staring at a barbell,
totally exhausted, just guessing how
many sets we actually did.
Why waste your limited mental energy
managing data when you should just be
lifting the weight?
In theory, progressive overload is just
simple math. But in practice, real life
gets in the way. Relying on memory means
you end up repeating the exact same
weights, which completely kills your
progress.
And honestly, a rigid spreadsheet
doesn't care if you only got 4 hours of
sleep last night. That's where dynamic
algorithms step in. They gently
recalibrate your progression based on
your actual life. Take AI gym, for
example. It's a premium AI personal
trainer that dynamically adapts to you
every single week. It actually does
real-time voice calls with you, reviews
your day, and remembers your specific
context. Stuck in a rusty hotel gym?
Scan the room, and it instantly rewrites
your progressive overload path.
Fitbod is quick but basic, while Future
uses expensive humans. AI gym bridges
that gap perfectly. You're trading
easily ignored push notifications for
active premium voice accountability for
about 25 bucks a month.
To be fair, if you need hands-on form
correction or injury rehab, human
professionals are absolutely mandatory.
So, if you're ready to build absolute
consistency, here is your exact
checklist to get started today.
Step one, pick a clear goal and set the
actual days you can realistically train.
Next, take your first AI gym coach call
and scan whatever gym equipment you
actually have access to.
Finally, do the workout, complete your
daily review, and let the algorithm
handle next week's math.
You can read our full guide on these
tools right now at the link on your
screen.
Try AI gym at your AI coach.life and
knock out that first setup step today.

### Progressive Overload at Home for Women 35+ | The Complete No-Gym Strength System
https://www.youtube.com/watch?v=QtUNV6oI2J4

But my dumbbells only go up to 10 kilos.
Do I just keep going? I get some version
of this question every single week from
women who train at home. And I get it
because the internet's answer to
everything is just lift heavier weights.
But what if you can't? What if you don't
have access to a gym? What if your
heaviest weight is just 5 kilos? Are
your results really capped? No, not even
close. Today, I'm going to give you my
top five ways to keep getting stronger
at home with the dumbbells you already
own. Also, the dead simple system that
tells you exactly what to aim for every
session. And then at the end, the honest
answer to when you actually do have to
go up in weights and how you'll know
when that time comes. [music]
But first, let's just talk about what
progressive overload actually is.
Because there is a lot of confusion out
there. It just means that you are
steadily and consistently getting
stronger and more proficient in your
lifts over time. And you do that by
methodically challenging your muscles
enough to make them adapt and grow in
both size and strength. Now, most people
think that just means adding more and
more weights every session, but they're
wrong. Because here's the thing, the key
to muscle growth is training to failure
or at least a few reps shy of it. And
when I say failure, I mean reaching that
point where you physically cannot do
another single rep without losing your
range of motion or correct form. That is
what stimulates muscle growth, not how
heavy you can lift. Now, in this 2022
randomized trial, there was a group who
progressed by adding more weight and
then another group who progressed by
adding more reps with the same weight.
And you know what was really
interesting? They both had the same
muscle growth after eight weeks because
your muscles count effort, not kilos.
And before anyone asks, because I also
get this one every week, too, is, "But I
won't end up looking like a big muscle
person, will I?"
>> Oh my god.
>> No. You will not get bulky from doing
progressive overload, no matter whether
you lift heavy or not. In fact,
deliberately getting stronger in your
lifts is exactly how you achieve the
body that you actually want. So, here's
rule number one of progressive overload.
No ego lifting. We do not yank and swing
our weights around.
Because throwing weight around that
compromises your form and technique is
not progressive overload. You might
think you're getting stronger because
technically you're lifting heavier, but
you're not. You're just cheating and you
will never build muscle that way. So the
first rule of progressive overload is to
master your form and your technique
first. Even if that just means body
weight only. Then and only then do you
start worrying about load. Actually let
me add a rule zero because some of you
are worrying about dumbbells and form
and progressive overload before you've
even cracked the thing that comes before
all of it. Sticking to a routine in the
first place. And I say this with love
because I know exactly who's watching.
You're busy. You've got kids, work, a
million responsibilities, and a mental
load that is just off the charts. And
consistency is the hardest part. But
progressive overload is built on
comparing your last session [music] to
the next session. So if there is no last
session, there's nothing to compare to.
It only works if you train and track
consistently, not one week or guns
blazing and then crickets for the next
four. because two or three unspectacular
workouts beats everything every single
time. And if that's the only thing you
take from this video,
you're on to a winner. So, before I give
you those five techniques, this is the
system that's going to put it all in
place for you because push harder
>> is not a plan. It's called double
progression. Your job is simple. You
just need to beat the last session by
one rep. So, pick a rep range for each
exercise. Let's say you're going to do a
bicep curl and your rep range is between
8 to 12 reps. If you're going to do
three sets of that exercise, let's say
last week you could do 8 87. [music]
Well, next week you're going to try for
8 88. And maybe the week after that
you'll try 9 88 [music] 8. Just keep
progressing like that every session
until you hit the top of your rep range,
which would be 12 12 with good form and
full range of motion. Of course, if you
can hit the top of your rep range for
two sessions in a row, that's called two
for two, then that's your green light.
Then you pick up the next dumbbell and
you drop down to your 888 rep range
again. And then you just start all over
again, climbing to the top. Now,
obviously, there's a catch if you train
from home because you're going to be
limited in the amount of dumbbells you
have. If you were in a gym setting, your
increments would be 2.5% each time,
which is manageable. But if you were
going from an 8 kilo to a 10 kilo,
that's a 25% increase. And nobody adds
that much in one go. So if that's what
you're dealing with at home, here are
the five techniques to help you progress
and get stronger, even if you only have
one set of dumbbells. Quick one before
we get into the list. If you're enjoying
this content, make sure that you
subscribe because I post strength
training videos for women 35 plus every
single week. No nonsense, no fads. Let's
get back into it. Number one, the
obvious one is just add more reps. Now,
everyone tells you to do the standard
three sets of 15 or four sets of 12. I
want you to see that as a guideline
because if 15 reps don't challenge you
anymore, just do more. Let's see if you
can fatigue by rep 20 or 25 or 30 even.
And before you come at me with that
whole, "Yeah, but you can't build muscle
with light weights and high reps."
>> Wrong. because the study I showed you
earlier proves that you can build muscle
with any rep range as long as you train
to failure. Number two is just do more
sets. So if you normally do three sets
of 15, try doing four sets of 15. Now I
know you can't just exponentially do
more and more sets. If you were to do 10
sets of each exercise, that would be
ridiculous. But you can also mix the
two. You can do more reps and also more
sets. That just basically is volume
training. So, you're just doing more
work overall. And that is your biggest
lever if you're working out from home
with limited equipment. Number three is
tempo, which is my personal favorite
because you don't actually have to
change the weight, the reps, or the
[music] sets. What this means is slowing
every rep down to at least the count of
three or four. So, if you can do say a
bicep curl for 15 reps at a normal pace,
try slowing it right down to the count
of three or four with control and good
form and see how many you can actually
do. My guess is a lot less. Then you
just build your reps back up at that
slower pace. Number four is pause reps
and pulse reps. So, a pause rep is
basically an isometric hold where you
are holding either the contraction or
the stretch part of the rep for 1 to two
seconds. So, for example, at the bottom
of a squat where your thighs are
parallel and you've got the full stretch
on the glutes, you hold here for 1 to
two seconds and then push your way back
up. So, if you can comfortably do 15
reps at a normal pace, try doing pause
reps and see how much faster you
fatigue. And then with pulse reps,
you're going to do full reps as normal.
And then when you start to reach
fatigue, try and squeeze out as many
more as you can do. And if you're an
absolute psycho, you can try combining
all of those things together. Slow tempo
pause reps and pulses. But don't say I
didn't warn you. And then finally, we've
got supersets and triceps. This just
basically means putting two exercises
back to back without any rest in
between. So, for example, doing squats
and then going straight into RDL's. It's
the same amount of work but done in less
time, which is way more challenging. And
there's also combo moves. So, you could
do a squat [music] press to a curtsy
lunge, which again is far more taxing
than just doing a squat and then a press
and then a curtsy lunge. And that's the
whole point of those five techniques
because you can continuously progress
over a 6 to 8 week program without
having to buy another single dumbbell.
And then when you do another program
after you finish that one, you're not
starting from scratch necessarily, but
your body will adapt to new stimulus and
you can try all those techniques all
over again. Now, I promised you honesty,
so here it is. These five techniques can
carry you for months and months. But I'm
not going to pretend like a heavier
dumbbell never matters because in some
instances it does. And here's the sign.
When you're ready, when you've exhausted
all of those five techniques, you are at
the top of your rep range and you're
still nowhere near failure, that weight
has now become your warm-up. And so you
might need to look at getting another
dumbbell. And if you're nervous about
progressing and you don't know whether
you'll actually be able to lift heavier,
remember the system. You don't meet the
new weight at the top end of the rep
range. You start down low again. You
meet it at the bottom of your rep range.
Maybe that's eight reps or six even.
That's the whole point of the system
because it gradually walks you all the
way up to it. But doing progressive
overload without tracking is pointless
unless you have a computer for a brain,
which actually probably a lot of us do
these days with AI. But anyway, that's
not the point. What I'm saying is you
need to track. So, you can either do
this in a notebook, the old school way
with pen and paper, or you can use the
notes in your phone, which was what I
used to do before I had my app. So, this
is what it looks like. Basically, you
need to know what you did last session
to be able to beat it by one on your
next session. Without writing things
down, you're never going to remember.
It's that simple. This is what I
actually did for years before I had my
own app. But now, you can also try the
app called Gym Track. It's free on the
basic plan. It's an app that Adam and I
built and specifically for this reason
to just track your reps and your sets
and you can build your own workouts and
it's super easy to use. I will link it
below. Also, a note on recovery with
progressive overload because we are not
robots. Not every workout is going to be
hitting PRs and pushing yourself to the
max. And you actually shouldn't be
aiming for that either, especially as a
woman and especially if you are in your
30s or beyond. your energy, your stress,
your sleep, and your mental load on any
given day is going to massively affect
your performance and also your cycle, by
the way, if you still have one. And no,
that doesn't mean you need to plan your
workouts around your cycle. It just
means expect waves. Some weeks are going
to be better than others, and that's
totally normal. Go with the flow. No pun
intended. Here at Strong Curves, we
listen to our body and we treat
ourselves kindly always. Also, I just
want to point out that you might see
young things on social media with this
kind of like go hard or go home
attitude. And while that's amazing and
very inspiring, don't make it feel like
you have to do the same to get results.
I want to emphatically reiterate that
you do not need to train like that or at
all to get good results at home. Those
hardcore 20somes who basically live in
the gym have youth on their side, oodles
of energy. They can push harder and
their recovery is faster. So please
don't compare yourself to them. For us,
as we get older, it's just as much about
progressive overload as it is about
recovery. So don't neglect your yoga,
your stretching, your myofacial release,
your posture work. And remember, we also
have families, responsibilities, work,
real lives, and very limited time. So
it's perfectly okay to do the best you
can with what you've got. You don't need
to over complicate it, and you don't
need to be perfect. Just consistent.
even if that is imperfectly. And if you
want all of this done for you, home
workouts where the progression is
already built in, where you literally
just press play and follow along with
me, download the Strong Curves app.
There's a 7-day free trial and the link
is below. Okay, thanks for watching.
Don't forget to like and subscribe, and
I'll catch you very soon in another
video. [music] Bye.

### Workout Tracker App | Monitor Workouts, Progress, and Fitness Goals with AppSheet
https://www.youtube.com/watch?v=2D2ZsCDYMhM

Track workouts, monitor progress in real
time, and achieve your fitness goals
with ease. As app sheet innovators,
Steagall makes workout tracking simple,
helping you log exercises, monitor
progress, and stay consistent.
Even leading platforms such as My
Fitness Pal, Fitbot, Fitness App, and
Pulse Fitness burden users with high
costs, complicated onboarding, and
limited flexibility.
Steaggle's workout log app provides a
streamlined free app sheet starter
solution with essential features to get
you up and running quickly.
Visualize your fitness journey at a
glance. Logging a new session is
effortless. Simply head to the record
exercise tab to input your data. Use
intuitive sliders to quickly log your
weights and repetitions for every set.
Track your body composition goals in the
weight dashboard. Here you can view your
weight history and see your progress
trend over time. Adding a new entry is a
breeze. Just select the date, enter your
weight, and watch your progress graph
update instantly. Stay accountable with
the log book. This centralized history
provides a detailed breakdown of every
exercise you've performed, helping you
monitor consistency and plan your next
move. Explore the exercise library to
find your favorite movements. You can
streamline your training all within one
powerful app sheet platform. If you want
us to customize it for your business,
we'll build it for you, tailor it to
your brand, provide ongoing support for
your app, integrate it with your
workflow, and ensure it complies with
the standards you need. With Steagall's
workout log, you can record workouts,
track fitness progress, monitor
performance in real time, and stay
motivated, all in one powerful
dashboard.
Best of all, it's free, built by Steagle
on App Sheet, and ready to transform how
you manage tasks and workflows.
Get the free app sheet template provided
in the description below.

## workout generator based on available equipment

### How AI Creates Custom Home Workout Plans Without Equipment
https://www.youtube.com/watch?v=Z-Qp1b7ozPM

What if your home workout could adapt to
your body in real time without a
personal trainer in the room? AI-powered
fitness platforms are now doing exactly
that. By analyzing inputs like your age,
fitness level, injuries, and available
equipment, or lack thereof, these
systems generate tailor routines that
evolve as you improve. The core
technology often relies on reinforcement
learning, where the AI adjusts exercise
type, intensity, and rest periods based
on performance feedback. Some apps even
use computer vision to track your form
through a phone camera, offering
corrections without human intervention.
The result is a workout plan that feels
personal, not generic, and can be done
in a living room with just a yoga mat.
The takeaway is clear. AI is
democratizing access to customized
fitness, turning any space into a smart
gym.

## workout logging app UX design

### Figma Paper Effect Log in (Sign in) | Sign up (Create Account) Page UI/UX Design No.3
https://www.youtube.com/watch?v=loHm5EyAFvk

Hello and welcome to my channel. In
today's video, we're going to create
this sign-in page, which is basically a
create an account page in Figma. All
right, let's get started. To begin
creating our project, we're going to
need a rectangle that looks like this. I
want to reuse the one I created when I
was creating this project, but I'm going
to show you how to create it. Let's
start with a rectangle. I'm just going
to draw a rectangle. The width of this
rectangle is 775
and the height is 9
85.
And I'm just going to have this here.
Next, I'm going to double click on the
rectangle, hold shift, and just move
this part back. And try to keep it
aligned so that we don't have the
rectangle um a little bit lower. Just
like this. Say something here. Next up,
go over to the pen tool and we are going
to add random dots along this side of
our rectangle.
I have no real spacing for it. Just put
dots at random parts of this rectangle.
Next, select the move tool. Let's go
back to the top. And for me, I kind of
push one back, push one front, just kind
of randomly push it in different
directions. So, I'm going to move this
one. Let's see. Back, front. You can
also move the dots like this if you feel
like it's not um what you want. I'm
going to maybe move this one front a
bit. Move this one. Oops. Move this one
back.
Maybe this one front. Maybe push this
one in a lot. Bring this one in like
this.
Maybe bring this one a little bit out.
Let me zoom out. So, yeah. Let me just
like push this one out,
this one in, and this one maybe just
let's see around like this. So, I'm
going to click on escape and escape. So,
even though I just created one, you can
see that it's actually different. And
that's probably what's going to happen
with yours. It's probably going to be
different. And that's fine. We just want
to have something that looks random.
What you're going to do now is go over
to stroke, add a stroke, change the
color of the stroke to white. The weight
of the stroke is going to be 10. And
then we're going to go over to settings.
We want to use brush. And for the brush
stroke, we want to use this brush, which
is called drone. And I'm just going to
select it. We're not going to change any
details. And that is it. So this is the
one I created when I was creating this
project. This is the one we just created
now. So, you can go ahead and create it
just like I demonstrated, but I want to
use this one because that's the one I
used when I was creating it. So, I'm
just going to select this and delete
this. Don't delete yours. I'm just
deleting it because I want to use this
one we have here. Next, we're going to
need a frame. So, I'm just going to
insert a frame like this. The width of
this frame is going to be 1 1440
and the height is going to be 960.
I'm going to grab this rectangle and
bring it into this frame and align the
center to the um rectangle and then move
this rectangle back till you can't see
the um let me just show you what I have
as spacing. So it's 15 from the left and
680 from the right. So you just want to
push it out a bit so you can't see any
of the parts of our stroke on the top,
left, and bottom. We just want to see it
on the right. Let's select selected on
this rectangle. Let's go over to fill.
I'm going to select for the fill. I'm
going to select image and I'm going to
upload from computer. The image I want
to use is this one. The link to that
image will be in the description box
below. And I'm just going to come out
here. You know what? The
um how it looks now, it's perfectly
fine. So, I'm just going to leave it as
it is. And I'm going to close this
dialogue. Next, I'm going to insert a
text. So, I'm going to just type
let's let me get closer so you can see
what I'm typing. Let the
adventure
begin
and I'm going to change the font to
Monzerat.
The weight is going to be extra bold.
Size is going to be
54 and the line height is going to be
62.
Let me zoom out. And
I want the text to look like this. So,
three lines of text that looks
um something like this. So, the width is
318 for me. Something like this. But you
just want your text to look like this.
For position, I want it to be 220 from
the top. So, I'm going to just show it's
actually checking for me from the top of
the rectangle. That's fine. I just I'm
just going for a relative um position
160 from the left, 220 from the top. So,
I'm just going to move my So, it's two
220
214. I want it to be
220 from the top and 160 from the left.
Yes, I know it's for me. Anyway, if it's
checking across um and it's checking AC
um referencing the frame, that's fine
for you. But for me, it's referencing
the rectangle. But anyway, the position
is fine. I just want it in the sort of
top right corner. Select the text once
more. Let's add an effect so it will pop
a bit. Let's go to effect. We're going
to add a drop shadow. We're just going
to leave the effect like this. We're not
going to make any changes. So, we just
want it to sort of look like it's
popping off on the page and not look too
flat. Select the frame and we're going
to change the frame the fill
the frame. Select the frame and we're
going to change the fill of the frame to
black. And I'm going to come over here
and on the right side of our screen or
our frame, we're going to now create the
content for our form. I'm going to
insert a text. So, I'm going to write
create an
account.
The font is going to stay as monat.
We're just going to change this to the
width to medium. Size is going to be
42 and the line height is going to be
50.
I'm just going to sort of bring it
around here. Next up is going to be a
rectangle. Let me come closer. Next up
is going to be a rectangle. So, I'm just
going to click on R and I'm just going
to create a rectangle.
The width is going to be 460
and the height is going to be 45.
Next up, let's add a stroke. Change the
stroke color to white and then remove
the fill.
We're going to need another text. So,
I'm just going to click on T so I can
insert a text box. And this will be
first name.
And I'm going to change the um weight to
regular. I'm also going to change the
font to enter. So the font is enter,
width is regular, the size is 16,
and the line height is going to be 24.
I'm now going to make this an auto
layout using shift and a. We're going to
change the padding on the left and right
to five and the padding on the top and
bottom to zero. Let's add a fill to this
frame. And we're going to make the fill
of the frame black. And I'm going to
align
I'm going to align this text this frame
so that the middle of our text is
aligned to the top of this rectangle.
And I want it to be the alignment to be
15 from the left of this rectangle. So,
it's currently 14 for me. I'm just going
to move it one more time so that it's
aligned 15 to the left of this
rectangle. I'm going to select the
rectangle and the text and I'm going to
group it. I'm going to zoom out and we
are going to use this reuse this fields
to create our other items. So, I'm just
going to create a bunch more. So, I need
a total of five fields and I'm just
going to create all of it.
Let's come back to this. I'm going to
change this to
last name.
This is going to be
email.
This is going to be
password
and this is going to be
confirm
password.
Let's add in some icons for this um two
fields. I'm going to right click. Let's
go to plugins and I'm going to run
iconify.
The icon I want to use is from. So all
you need to do is search for I
off and it will give you a bunch of
options. I'm going to select from icon
set. So the icon set is going to be the
one from
let me see
this one. Ion icons. I think we're going
to use this um outline one. So, I'm just
going to
just grab a copy and then bring it into
my frame. And I'm going to change the
Let me grab this. I'm going to bring it
to this rectangle. I can also
ungroup for now. Come back here. I'm
going to leave the dimensions as 16 by
16. What I want is I want it to be 15
from the right of our rectangle. So, I'm
going to move it back two more times.
So, it's 15 from the right of the
rectangle and it should be in the
center. I'm going to zoom out, select
all of this. I could just also let me
create a copy of this before I group it.
I'm going to select all of these
elements
and then group it again. Same with this.
I'm just going to make sure I have the
proper alignment. So, I want it to be
15.
Let me select the group. I want to
ungroup it first.
I'm going to select this, align it to
the center first, and then it should be
15
from the
right of our rectangle. Now, select
everything again and then group.
We're going to add some final details.
Let's add another rectangle. So, I'm
just going to click on R and just draw a
rectangle. The width of this rectangle
is going to be 20. The height is also
going to be 20.
Let's add a stroke. Change the color of
the stroke to white. And then we're
going to remove the fill. Let's insert a
text box. This text is going to be on
the longer side. I already have it on my
clipboard and I'm just going to paste.
So this is text by signing in
you accept the terms and conditions dems
of service and privacy policy. So all
you need to do is have everything in the
same text box. You don't need to make
multiple text box. So if you want to
change it, all you need to highlight
this terms of service and then change
the color to this green color. That's
all you need to do. Select it, change
the color like I could demonstrate by
doing. Select this and then in fill
change the color to um let me just pick
something different from the green color
I have. Let me see this red color. And
that's how you can change the color of
the text. So in your own case when you
type in the text just select terms of
service and then change the color to
this. I just don't want to actually have
a note. I'm opening my notes and then
doing it in this project. So the size of
this text is the typography the font is
enter size is 14 and the line height is
going to be 20. I'm going to
bring this here. Select this two the
rectangle and the text. Make it an
layout and the gap should be 10. Let me
zoom out. I'm going to select this um
last group and this one. I can also make
it an auto layout. And the gap I want it
to be
10. And I'm going to select all of these
items.
The spacing between all of these items
is going to be
20. And then I'm just going to group
everything. Let's add our login button
or our create account button and
additional text. So I'm going to click
on T to insert a text. And I'm just
going to type
create account.
The size, the font is going to stay as
enter. Size is going to be 20 and the
line height is going to be 26. I'm going
to create an odd layout with this text.
The padding for the left and right is
going to be
45 and the padding on the top and bottom
is going to be 15.
Let's add a stroke. And we're going to
change the color of the stroke to white.
And we can leave everything as it is.
Let's add our final text. I'm just going
to click on T so I can insert a text.
And this will be
already
have an account.
And then there's going to be sign in.
And I'm going to highlight this sign in.
And the fill is going to be. So on this
page, we already have this green color.
That's the green color that is here. Or
you could use the color picker to check.
I'm just going to change it to that
green color. I'm going to change the
size of the text. So the size of this
text is going to be 16 and the line
height is going to be 22. The font is
still in. I'm just going to bring this
two. Select this two. Make the spacing
15. And I could just group it. Or you
could make it an auto layout if you want
to. I'm going to zoom out. And now let's
space out all of our elements. And we'll
be done with this. I'm going to select
all of this.
So this group and this text. I'm going
to use Alt H. And I'm or I'm aligning
their horizontal centers. Or you could
come over to alignment, position
alignment, then use this button. I just
use the shortcut, which is alt h. The
spacing is going to be 60. And I could
just go ahead and group this. For the
position, I'm going to check it should
be 140 from the right of your frame. So
I'm going to move this group.
Let me see.
140 from the right. And then I'm just
going to move this so that it's on the
center of my frame. So it should be this
for me. It's 151 from the top, 451 from
the bottom, and 140 from the right. And
yeah, that is it for this form. I'm just
going to run it in the prototype view so
you can see what it looks like. So this
is what our form looks like in the
prototype view. You can go around and
play around with, you know, different
things. Maybe change the image, try
different colors or fonts, things like
that. That's entirely fine. But anyway,
that is it for this particular tutorial.
If you want to watch longer projects for
UIUX design in Figma, you can check out
the description box below to the links
to those videos or the courses available
on my channel. Anyway, thank you so much
for watching. Please like, share, and
subscribe, and I will see you in the
next one.

### Is This The BEST FREE Fitness App For Free Workout Programs? | Boostcamp Review
https://www.youtube.com/watch?v=ffvAAQ3pt2c

Hey, I'm Jen. I review tech and apps,
and today, let's talk about one of the
best valued workout apps on the market
right now. So, this app is called
Boostcamp. It's specifically created to
be a free workout tracker, but more
specifically, actually has over 11,000
free programs that are accessible to you
for free. No subscription, no catch.
Today, we're going to do a deep dive of
this insanely valuable app and do a full
review of what makes Boostcamp so good,
how it can track your workouts, cover
the paid features, and most importantly,
is it actually worth your money? And
before we dive in, if you're into
anything about tech and apps, make sure
you hit that subscribe button. It
supports the channel, and I greatly
appreciate it. Let's get into it. So,
what is Boostcamp? Well, Boostcamp at
its core is basically a all-in-one
workout tracker. And it's specifically
built for people who want to streamline
their online program experience. So,
instead of searching, writing, and
copying down programs that you find
online, Boostcamp has everything
directly built in to the app. And the
best part is that this simplifies the
entire experience of finding online
programs so that you can focus on what
actually matters, getting stronger in
the gym. So, first, let's talk about the
app experience. So, the app's navigation
is very easy and simple to use. At the
bottom of the app, you're met with four
tabs, program, train, analytics, and
community. So, first, let's talk about
the programs tab. This is essentially
where you can access and see every
single workout program available to you.
Of course, you can actually build your
own program if you like, but that's not
what we're here to talk about today. So,
each free or pro program shows a small
tag on the top right corner stating
whether it's free or pro. So, pro is
when a subscription comes into play, but
keep in mind, even without the
subscription, you still get 11,000 free
program. And the best part is that
they're all designed from beginner to
intermediate to advanced lifters. Or if
you're more goal-oriented, it also is
designed for that as well. And they also
offer gender-specific options as well,
and all of this is built directly right
into the app for free. So, the app
features some of the most famous and
notorious workout programs known to all
lifters. So, programs such as Insanity,
which is something that we're familiar
with and I've done videos on, but also
Westside Barbell, if you're interested
and know that, that's also built into
the app. [music] Or, if you have really
big YouTubers and fitness creators that
you follow, likely that their programs
are also built into Boostcamp as well.
So, just for example, one of my favorite
programs that helped me get my squat
from 225 to 405 lbs in basically a few
months is Insanity. Now, at the time, I
basically had to input everything
manually, create this Excel doc
manually, and track everything and do
the math myself. But, with Boostcamp,
not only can you find multiple versions
of Insanity for free on the app, but if
you join the program, you can select
exactly how many days and which version
of Insanity you want to do, which is so
[music]
convenient. Now, once you join the
program, you enter your maxes and it
will automatically update the program
for you. Best of all, the app includes a
progressive overload feature that
automatically increases your reps or
weight on your next session. And not a
lot of traditional fitness features
actually include this for free, so I got
to give kudos to Boostcamp for having
this feature for free. Okay, now logging
your lifts is also super simple. Here,
it shows your target in the left-hand
column and the right-hand column is
where you input the pounds and reps you
actually lifted. To add a set, you swipe
left. To delete one, you swipe right.
Another nice touch that I enjoy about
the Insanity program on the app itself
is that it shows your percentages based
on the maxes that you inputted for
yourself, which is going to give you a
great indication of what you're lifting
and more knowledge about how you're
lifting. Now, to make it even easier for
yourself, if you tap the calculator
button in the corner, you can see
exactly what plates to load, making the
whole process extremely user-friendly
for any lifter. And guys, even though
I've been going to gym for years, I
absolutely love this feature. I still
get confused from time to time on what
plates to
>> [music]
>> stack on. Okay, now let's talk about the
train tab. Now this tab shows a ton of
widgets for a quick glance at your
lifting stats. You can see the progress
of your current program along with a few
nice widgets showing your workout
streak, lifetime stats across all your
workouts, and your body weight and
progress photos if you choose to use
them. Next, let's talk about the
analytics tab, and this is more of a pro
feature. Now this tab is actually hidden
behind a paywall, but let me explain why
I'm not mad about it, and also why I
think it might be worth it for you. So
here you can see your strength score,
muscle tracker, training trends, and
exercise analytics.
>> [music]
>> So the strength score is essentially a
score that measures how strong you are
relative to your body size. And the nice
thing is that it factors a couple of
things. So things like your body weight
and age to keep the score consistent. I
also want to mention that this feature
actually provides a score for each
exercise and identifies the user's level
from beginner, intermediate, to advanced
as well. Now the muscle tracker is
color-coded by volume showing which
muscles you're working out the most. And
training trends is a really great way to
see your training over time. So things
like volume, frequency, and body weight
are all data points that give you a
comprehensive visualization of your
training history. Next, the exercise
analytics is pretty awesome because it
gives you actually a one rep max
visualization on a graph. And this is a
really cool way to gain some placebo
confidence going into a one rep max day.
Regardless, I absolutely love this
feature and we'll get a little bit more
into it later in the video. Last but not
least is the community feature. Now I've
really enjoyed how they made this
feature, the community feature, almost
like a Reddit-style timeline. This is
great because it's no fluff, and
basically you can see exactly what your
friends or people you follow lifted
without diving too deep into the stats.
And honestly, I actually like this
community feature a lot more than even
apps like heavy and how they do it.
Because it's simple, it's easy, it's no
distractions, and of course it's easy to
read. And it's a great way to compete
with yourself, your friends, and other
creators, or maybe inflate yourself and
your ego, especially when you see that
you lift more than the CEO of the app.
Now, before we get to whether it's
actually worth it or not, I do want to
get into a couple more things that I
love and dislike about the Boost Camp
app. To my surprise, I absolutely love
the fact that the Boost Camp app
actually directly connects with the
Apple Health app. So, if you want to
close your rings, rest assured, you can
absolutely do that with the Boost Camp
app. Now, within the settings, you also
get a warm-up set template. So, if you
want warm-up sets in your workouts
without constantly having to add them
manually, you absolutely can. And just
to mention one more time, I love the
exercise analytics graph. And this is
where it gives you a visual
representation of your one-rep max. And
like I said, this is awesome, and I wish
other apps actually had this feature.
And the craziest part is that you can
actually change exactly how you measure
your one-rep max using a couple of
different methods. One of them is the
Brzycki method, the other is the RPE,
and the third is the volume. And all of
this is just a really nice intuitive
touch to help [music] you get stronger
in the gym. Now, let's talk about some
things that I dislike about the Boost
Camp app. Now, on number one, I really
wish that this app was able to connect
with the Apple Watch for a couple of
reasons. Number one, being able to bring
your watch and not your phone in the gym
to work out with the Boost Camp app
would be huge. I also want to be able to
track my heart rate as well during my
workouts. And honestly, just getting
that additional heart rate data does
mean something to me. Now, I was talking
to the CEO of the Boost Camp app, and
they were telling me that this is a
feature that will be coming out in the
future. Now, another thing that I don't
necessarily dislike, but I think they
can improve on or add to is add just a
little bit more personal questions into
the onboarding process of the Boost Camp
app. And what I mean by this is like
entering things like previous exercises
that don't work for you or that you want
to avoid or maybe previous injuries that
you've had, or more questions like that.
That way it can help match more programs
to my needs and make it a little a
little more personalized so that I can
actually focus on finding the correct
program for me instead of sifting
through 11,000 programs. And lastly, it
doesn't have a lifetime subscription,
which sucks because if you know me, I
absolutely love lifetime subscription
apps. But honestly though, I don't think
it really even needs one considering the
fact that this app is pretty much free
already, so you do get a ton of value
there. So, is it worth it? Guys,
Boostcamp app is essentially $0 on the
App Store and it's completely free. For
paying nothing, you literally get over
11,000
programs. If I haven't repeated myself
enough, you get my favorite programs
like Insanity, you also get the Westside
Barbell program as well. Plus workout
tracking and also community access as
well. The only things that you truly
miss out on are just a couple things
like the pro programs from some of your
favorite creators and unlimited routine
builders instead of just three. And of
course, the analytics tabs as well. So,
to me, it's a no-brainer. This app is an
insane value when it comes to being $0
and $0. At the very least, it's worth
the download just so you can sift
through the programs at your own
convenience. If you are interested in
the pro features, it's only $79.99 a
year, which to be honest, with all the
apps I've tested, is a very, very
reasonable price. So, with that being
said guys, thank you so much for
watching the video. That is the end of
this review. If you guys are interested
in more app reviews, tech and also tech
wearables, make sure you subscribe. Make
sure you check out some of these videos.
It really supports the channel and I
hope to see you guys on the next one.
Peace.

### SHRED vs Fitbod | Which Workout App Is Better?
https://www.youtube.com/watch?v=tkFrY_Z1aoA

Hey, everyone. Welcome back to the
channel. Today, I'll be comparing two of
the most well-known AI-powered fitness
apps out there, Shred and Fitbod, to
help you figure out which one might be a
better fit for your training style and
goals. Both apps are designed to take
the guesswork out of working out. They
build personalized plans, guide you
through sessions, and adapt as you
improve. But, once you start using them,
the experience feels completely
different. Shredder works more like a
hybrid personal trainer. He combines AI
with expert-built programs, guided
workouts, and even group features.
Fitbod keeps things more minimal and
algorithm-driven. It's centered around
daily workout generation based on muscle
recovery and your past performance. Now,
I've spent real time with both of these
apps, testing them at home, in the gym,
on days where I felt great, and on days
I barely even wanted to move. So, in
this video, I'll walk you through how
they work, how they feel, and which one
might be a better fit long-term,
depending on what keeps you consistent.
Quick heads-up, I put affiliate links in
the description for everything we've
covered. If you use them, I earn a
commission at no extra cost to you,
which helps support the channel. Now,
when you first open each app, you'll go
through a pretty familiar setup. Your
goals, your training location, and the
equipment you have access to. Fitbod
keeps this part super minimal. You go
through a few prompts, pick your gear,
and the app instantly starts building
workouts. There's no plan to follow, it
just delivers a fresh session each day
based on recovery and past performance.
So, it's quick, hands-off, and kind of
just runs quietly in the background.
Now, Shred takes a bit of a different
approach. You still enter your goals and
your equipment, but you also choose how
you want to train. Whether that's
strength-focused splits, studio-style
classes, or bodyweight-only sessions,
and then it actually builds a full game
plan around that. So, you're not just
thrown into a workout. There's
structured pacing and coaching backed in
by Day One. It all feels purposeful. You
got videos walking you through
everything, so even if you've been
lifting for years, it still feels
polished and personalized, like someone
actually built it for you. And that
ended up making a big difference for me.
With Fitbod, you're reacting to the
workout it gives you. With Shred, it
feels like the app is leading the
session and that kind of shifts your
mindset at the gym. Then, once you're
inside a workout, you can really feel
the contrast between the two. Fitbod
kind of lays everything out up front,
sets, reps, weight. You tap through at
your own pace, rate how each set felt,
and it logs everything automatically.
It's [music] quick and efficient, but
there's no pacing, no coaching, no cues.
You're essentially running the whole
session by yourself and that works
totally fine if you're already locked in
and just want a smooth way to progress,
but it can feel a little dry over time,
more like updating a spreadsheet than
being guided through an actual workout.
Shred feels a lot more involved. The
workouts are structured into circuits,
supersets, or even giant sets depending
on the day. You got coaching cues, rest
timers, and automatic adjustments built
in, whether that's for weight increases,
tempo changes, or shorter rest times to
keep the pace up. And because
everything's led in real time, you're
not dragging yourself through it. The
session moves by the and you feel like
you actually trained with purpose. I
also really liked how easy it was to
switch between modes. Some days I'd
stick with my strength split, other days
I'd jump into a boxing or hit class just
to keep things interesting. That
built-in variety can be the difference
when you're trying to keep consistent
for more time than just a few weeks
because if you're anything like me, you
know that just sticking with one plan
kind of gets boring. Now, both apps do a
solid job tracking your workouts, but
they value separate kinds of data.
Fitbod is all about the numbers, every
rep, every set, every weight. It logs
everything automatically and you get a
visual breakdown of your total volume,
personal records, muscle group
frequency, you know, all of it. It also
has this muscle freshness map that shows
which areas have recovered and which are
still fatigued. So, the next workout
will always be something fresh and
you're not just trying to wonder if you
could hit chest again. Shred tracks your
lifts and consistency, too, but it leans
more into how the session feels rather
than the raw numbers. The AI adjusts
your plan week to week, adding weight,
changing tempo, or tweaking rest based
on how you're performing.
>> [music]
>> It's really like having a coach keep
tabs on your progress. And what's cool
is how deeply it customizes your
equipment. You can plug in everything,
your own dumbbells, resistance band,
even specific bench types. And it builds
each workout around that. So, whether I
was training at home or in a hotel gym,
I never got exercises I couldn't do.
Now, Fitbod lets you make equipment
profiles, too, but it's a little more
rigid. It works, but I still got the
occasional exercise that didn't match
what I had, and that just means a little
extra time, you know, finding an
alternative. And as for pricing, Fitbod
is subscription only. It's about $16 a
month or 96 bucks for the year. Shred
gives you a bit more flexibility.
There's a free tier with basic workouts,
demo videos, and some light tracking.
But if you just want to test things out,
then Shred Ultimate is the full version
with AI coaching, coach AI chat, studio
classes, Apple Watch support, all the
good stuff. That runs just under 20
bucks a month or about 120 bucks for the
year, and the annual plan comes with a
7-day free trial. Great, again, if you
just want to give it a try. So, both
apps will grow with you, but Shred does
it in a more flexible, hands-off way,
and the gap only grows the longer you
use it. With Fitbod, what you see is
mostly what you get. The workouts are
solid, the progression is steady, and
the algorithm just keeps pushing things
along. But it's all very solo. After a
while of repeating that, it can feel
kind of flat, especially if you're
someone who needs variety or feedback to
stay motivated. Shred builds that
engagement in from the start, between
the pacing, the class options, the
real-time coaching, it just feels more
dynamic. And if you want extra
accountability, there's a whole social
aspect with squads, challenges, and
leaderboards. You don't have to use it,
but it's nice to have if you want it.
And long-term, that kind of variety and
motivation can make all the difference.
So, here's where it really comes down to
preference. If you're already
self-motivated and just want a clean way
to build workouts, track your lifts,
[music]
and steadily increase strength over
time, Fitbod handles that very well.
It's efficient, clean, and the algorithm
keeps you progressing without a lot of
input, but you'll need to bring the
energy yourself. Shred offers a
different kind of experience. Between
the coaching cues, the structured
pacing, and the built-in variety, it
makes every session feel more engaging.
You're being guided, not just given a
checklist you got to go through. So, it
just makes everything easier, even when
motivation's low. So, while both apps
are capable of helping you improve,
Shred is just more complete. The
experience is smoother, more engaging,
and easier to stick with long-term if
variety and consistency matter to you
just as much as results. If Shred sounds
like it might be a better fit for your
training style, check out the link in
the description. Like I mentioned
earlier, we usually have special offers
on the affiliate link that you wouldn't
be able to get on the company's main
website. Also, if you're interested in
working with us or sponsoring future
video, just reach out using the email in
the description down below. Hopefully,
you found this comparison helpful, and
if you did, please leave a thumbs up and
consider subscribing as I always
appreciate that. And if you have any
questions or want to share anything
about your own experiences with either
app, just drop them down in the
comments. I love getting to answer as
many as I can. Finally, guys, thank you
so much for watching. Take care.

