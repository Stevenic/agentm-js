# AgentM
AgentM is a library of "Micro Agents" that make it easy to add reliable intelligence to any application. The philosophy behind AgentM is that "Agents" should be mostly comprised of deterministic code with a sprinkle of LLM powered intelligence mixed in. Many of the existing Agent frameworks place the LLM at the center of the application as an orchestrator that calls a collection of tools. In an AgentM application, your code is the orchestrator and you only call a micro agent when you need to perform a task that requires intelligence. To make adding this intelligence to your code easy, the JavaScript version of AgentM surfaces these micro agents as a simple library of functions.

## Pulse
In addition to the AgentM library of "Micro Agents", AgentM include a very unique webserver called **Pulse**.  What makes Pulse unique is that it's organized as collection of web pages that are self modifying and 100% AI generated. You can think of it like a wiki where every page is writen by an LLM under your direction. Not only can these pages contain traditional wiki like content but the LLM is free to write code so they can contain generated animations or even complete mini applications.  To learn more about installing and using Pulse visit it's [dedicated readme](https://github.com/Stevenic/agentm-js/tree/main/cli#readme).


## Included Micro Agents
The initial release of AgentM includes support for calling OpenAI's GPT-4o family of models and makes heavy use of OpenAI's new [Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) feature which dramatically improves the reliability of working with LLM's. The library includes the following micro agents:

- **argumentParser** - Parses a set of arguments expressed using natural language into a strongly typed object. This can be used to create CLI tools that you can give commands to using natural language. No need for flags or switches anymore. 
- **binaryClassifyList** - Provides a binary true/false classification of items in a list. The results should be similar to filterList but without removing any items from the list.
- **chainOfThought** - Uses structured outputs to separate the models chain-of-thought reasoning from it's answer. Useful to both get the model to perform chain-of-thought reasoning and to hide all of the details from a user.
- **classifyList** - Can classify items in a list using a provided list of categories. Useful for everything for sentiment classification to categorizing documents. Another work horse agent.
- **filterList** - Able to filter the items in a list based upon some criteria. It's useful where you want to make an intelligent decision around whether to keep an item in the list or remove it. Like mapList, this agent is a work horse you'll use over and over.
- **generateObject** - Generates a new instance of a structured object. Useful for doing things like generating the code where you only want the code back or generating dynamic UI.
- **groundedAnswer** - Uses a hallucination guard to ground the models answer within a provided context. Can be paired with RAG strategies to implement a Q&A system. 
- **mapList** - Takes a list of items as input and maps each item to a structured output. This is useful for performing a wide range of GenAI tasks like intelligently parsing a web page or transforming records written in one language to a different language.
- **projectList** - Creates projections for a list of items using a template. Similar to summarizeList but the template gives much better control over the formatting of the models response.
- **reduceList** - Able to count things using human like first principles. When humans count, we count each item one by one and make a mental note of our progress along the way. The reduceList agent counts the same way. It's useful for counting long sequences of things where intelligence is needed. For example you could use it to analyze customer support logs and count the number of cases that ended with a positive versus negative sentiment.
- **sortList** - Able to sort a list using some criteria requiring intelligence. For example, you can give it a list of events and ask the agent return them in chronological order. It implements merge sort so it has a very stable sort complexity of O(n log n) but that is still probably prohibitively expensive for most use cases. In most cases you're probably better off using mapList to map a lists items to a shape that can be sorted using traditional deterministic algorithms.
- **summarizeList** - Can generate text summaries for a list of items. Similar functionality as mapList but designed to return an input as a text summary.

Have an idea for a new micro agent or feedback, start a new [discussion](https://github.com/Stevenic/agentm-js/discussions). Or if you're interesting in contributing to either the JavaScript or upcoming [Python version](https://github.com/Stevenic/agentm-py) of AgentM let me know... 

## Prerequisites
AgentM currently supports OpenAI based models like gpt-4o and gpt-4o-mini. To use AgentM you will need an OpenAI API Key which you create from the dashboard here:

https://platform.openai.com/api-keys

## Installation
Ensure that you have recent versions of [Node.js](https://nodejs.org/en) and [yarn](https://yarnpkg.com/) installed. To add AgentM to an existing project you can run:

```bash
$ yarn add agentm-core
```


## Quick Start 
To get you started with AgentM we'll walk through the code for the [filter-discography](https://github.com/Stevenic/agentm-js/blob/main/examples/filter-discography.ts) example. This example is a toy example that takes a randomized list of every [Rush](https://en.wikipedia.org/wiki/Rush_discography) studio album and first filters the list to albums released in the 1980's, then sorts the list chronologically, and finally maps the sorted list to an array of JSON objects that contain the title and a detailed description of each album. All of this using just a list of randomized titles as a starting point. 

The example uses [dotenv](https://www.npmjs.com/package/dotenv) to retrieve your OpenAI API Key so to set that up create a **.env** file in your project with the following structure:

```
apiKey=<Your_OpenAI_API_Key>
```

With your OpenAI key setup we can start by importing the AgentM library and load our .env file:

```TS
import { openai, filterList, sortList, mapList } from "agentm-core";
import * as dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();
```

With the .env file loaded we need to initialize the model we're going to use and create a cancellation function:

```TS
// Initialize OpenAI 
const apiKey = process.env.apiKey!;
const model = 'gpt-4o-mini';
const completePrompt = openai({ apiKey, model });

// Create cancellation token
const shouldContinue = () => true;
```

You can technically use any OpenAI models but you'll generally want to stick with the GPT-4 class of models as they're both cheaper and generally more capable. In this example we're using `gpt-4o-mini` which is currently OpenAI's most affordable model.

The call to the `openai()` returns a function that can be used to call OpenAI's chat completion endpoint. The `shouldContinue()` function we're defining gives us a mechanism to cancel agents that are taking too long to run. We don't currently need cancellation support so we can just always return `true` for this function.

Next we'll define the data for the list we want to manipulate:

```TS
// Create randomized list of rushes studio albums
const rushAlbums = [
    "Grace Under Pressure",
    "Hemispheres",
    "Permanent Waves",
    "Presto",
    "Clockwork Angels",
    "Roll the Bones",
    "Signals",
    "Rush",
    "Power Windows",
    "Fly by Night",
    "A Farewell to Kings",
    "2112",
    "Snakes & Arrows",
    "Test for Echo",
    "Caress of Steel",
    "Moving Pictures",
    "Counterparts",
    "Vapor Trails",
    "Hold Your Fire"
];

// Define output shape
interface AlbumDetails {
    title: string;
    details: string;
}

const outputShape = { title: '<album title>', details: '<detailed summary of album including its release date>' };
```

The list is obviously all of Rush's studio albums and the "Output Shape" defines the shape of the final output we want the albums to be in.  This shape is comprised of an interface (when using TypeScript) and a "JSON Sketch" of the what we want returned for each album.

Now we can start calling our micro agents to manipulate the list:

```TS
// Filter and then sort list of albums chronologically
async function filterAndSortList() {
    // Filter list to only include albums from the 80's
    const parallelCompletions = 3;
    const filterGoal = `Filter the list to only include rush albums released in the 1980's.`;
    const filtered = await filterList({goal: filterGoal, list: rushAlbums, parallelCompletions, completePrompt, shouldContinue });
```

The `filterList()` agent takes a list as input and filters it using criteria expressed as a `goal`. All agents take a required `completePrompt()` & `shouldContinue()` functions as input and most take a `goal`. The list functions all require the `list` be passed in and many take a `parallelCompletions` parameter as an argument. The `parallelCompletions` argument lets you specific the number of simultaneous request to make to the model and can be used to reduce the latency of certain operations. Note that there's not much point in trying to perform more than 4 parallel completions at a time and you also need to take into account your OpenAI tier otherwise you risk being rate limited.

In this example the output of `filterList()` should be an array with 7 titles:

```TS
[ "Grace Under Pressure", "Permanent Waves", "Presto", "Signals", "Power Windows", "Moving Pictures", "Hold Your Fire" ]
```

Next we want to sort the list to be in chronological order:

```TS
    // Sort filtered list chronologically
    const sortGoal = `Sort the list of rush studio albums chronologically from oldest to newest.`;
    const sorted = await sortList({goal: sortGoal, list: filtered.value!, parallelCompletions, completePrompt, shouldContinue });
```

All of the agents return an object called an `AgentCompletion`. This object has a `completed` property which will be set to true if the request was successful. If the request is successful you can access the returned result from the `value` property. If the request fails (or is cancelled) the `error` property will contain an `Error` object you can inspect.

The result of `sortList()`, in our example, is an array that has sorted the title chronologically:

```TS
[ "Permanent Waves", "Moving Pictures", "Signals", "Grace Under Pressure", "Power Windows", "Hold Your Fire", "Presto" ]
```

Finally we want to leverage the models world knowledge to add additional details:

```TS

    // Add in world knowledge
    const detailsGoal = `Map the item to the output shape.`;
    const details = await mapList<AlbumDetails>({goal: detailsGoal, list: sorted.value!, outputShape, parallelCompletions, completePrompt, shouldContinue });

    // Print sorted list
    details.value!.forEach((item) => console.log(`Title: \x1b[32m${item.title}\x1b[0m\nDetails: \x1b[32m${item.details}\x1b[0m\n`));
}

filterAndSortList();
```

The list passed to `mapList()` will be transformed from a list of strings to a list of strongly typed objects. You can use the mapList agent to perform just about any type of transform you can think of. In this case we're asking the model to add information using it's world knowledge but we could just as easily asked it to summarize some text, translate the input to another language, etc.  The `mapList()` and `filterList()` agents are likely to be the two agents you use the most. And keep in mind that if you want to transform a single object that's just a list with 1 item in it.

If you run our completed example you should see something that looks like this:

```bash
c:\source\agentm-js\examples>yarn start filter-discography.ts
Filtering albums to the 80's...
Sorting albums chronologically...
Generating album details...
Title: Permanent Waves
Details: Permanent Waves is the seventh studio album by the Canadian rock band Rush, released on January 1, 1980. The album features a blend of progressive rock and new wave influences, showcasing the band's evolving sound with tracks like 'Spirit of Radio' and 'Freewill'.

Title: Moving Pictures
Details: 'Moving Pictures' is the eighth studio album by the Canadian rock band Rush, released on February 12, 1981. The album features some of the band's most popular songs, including 'Tom Sawyer' and 'Limelight', and is known for its blend of progressive rock and mainstream appeal.

Title: Signals
Details: 'Signals' is the thirteenth studio album by the Canadian rock band Rush, released on September 9, 1982. The album features a blend of progressive rock and new wave influences, showcasing the band's evolution in sound during the early 1980s.

Title: Grace Under Pressure
Details: 'Grace Under Pressure' is the tenth studio album by the Canadian rock band Rush, released on April 12, 1984. The album features a blend of progressive rock and new wave influences, showcasing the band's evolution in sound during the 1980s. It includes notable tracks such as 'Distant Early Warning' and 'The Body Electric.'

Title: Power Windows
Details: Power Windows is the eleventh studio album by Canadian rock band Rush, released on October 29, 1985. The album features a blend of progressive rock and synthesizer-driven sound, showcasing the band's evolution in the 1980s.

Title: Hold Your Fire
Details: 'Hold Your Fire' is the twelfth studio album by the Canadian rock band Rush, released on September 21, 1987. The album features a blend of progressive rock and synthesizer-driven sound, showcasing the band's evolution in style during the late 1980s.

Title: Presto
Details: Presto is the thirteenth studio album by the Canadian rock band Rush, released on November 21, 1989. The album features a blend of progressive rock and more accessible pop elements, showcasing the band's evolution in sound during the late 1980s.
```
