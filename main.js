var svg = d3.select("#map"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    tooltip = d3.select("#tooltip");

// World Map Projection
var projection = d3.geoNaturalEarth1().scale(130).translate([width / 2, height / 2]);
var path = d3.geoPath().projection(projection);
var medalData = d3.map();

// color gradient - starts from medium blue instead of very light
function customInterpolateBlues(t) {
    return d3.interpolateBlues(t * 0.7 + 0.3); }
var colorScale = d3.scaleSequential(customInterpolateBlues);

// Load data
d3.queue()
    .defer(d3.json, "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .defer(d3.csv, "dataset/medals_total.csv", function(d) {
        medalData.set(d.country_code, {
            name: d.country_long || d.country,
            gold: +d["Gold Medal"],
            silver: +d["Silver Medal"],
            bronze: +d["Bronze Medal"],
            total: +d.Total,
            shortName: d.country
        });
    })
    .await(function(error, topo) {
        if (error) throw error;

// Making the medal data to work with 
var medalValues = Array.from(medalData.values(), d => d.total).filter(d => d > 0);
var maxMedals = d3.max(medalValues) || 1;
colorScale.domain([1, maxMedals]);

// Making the svg to work with for the world map
const g = svg.append("g"); 
    svg.insert("rect", ":first-child")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "transparent")
    .style("cursor", "pointer")
    .on("click", function() {
    g.transition()
        .duration(750)
        .attr("transform", "translate(0,0) scale(1)");
    g.selectAll(".country").classed("selected", false);
});


/**
 * The beginning of treemap function.
 * This function draws the treemap for a given country name. This is called when the user clicks on country on the map.
 * @param {*} countryName The country name of the country the user clicks on.
 */
function drawTreemap(countryName) {

    d3.csv("dataset/medals.csv",function(error, data) {
        if (error) throw error;

        // removes the previous graph before drawing the next one
        d3.select("#sidebar-container").select("#treemap-svg").remove();

        // can change the country here for the tree map 
        let countryFilteredData = data.filter(d => d.country === countryName);
        const allDisciplines = {}; 

        // Filter the country data according to discipline
        countryFilteredData.forEach(d => {
        if (!allDisciplines[d.discipline]) {
            allDisciplines[d.discipline] = 0;
        } 
            allDisciplines[d.discipline]++;
        });

        // Get the top 10 disciplines and sort them 
        const top10 = Object.entries(allDisciplines)
        .sort((a, b) => b[1] - a[1]) // most to least
        .slice(0, 10); //  want only the top 10 

        // Assign the top10 sports and their corresponding medal counts.
        dataTreeMap = {
        name: `${countryName} Medals`,
        children: top10.map(([name, value]) => ({ name, value })) // need to do this so it works for the root later 
        };

        // make the dimensions of the treemap according to the sidebar container
        const width = document.getElementById("sidebar-container").clientWidth;
        const height = document.getElementById("sidebar-container").clientHeight; 

        // make a new container to add the treemap to the existing container
        const container = d3.select("#sidebar-container");
        const svg = container.append("svg")
            .attr("id", "treemap-svg") 
            .attr("width", width)
            .attr("height", height);

        const root = d3.hierarchy(dataTreeMap)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        // making the actual treemap here with this function sot hat we know the width and the height 
        d3.treemap()
            .size([width, height])
            .padding(4)
            (root);
            
        const treetooltip = d3.select("#tree-tooltip"); // specify tooltip

        // drawing the actual squares here to show there 
        svg.selectAll("rect")
            .data(root.leaves())
            .enter()
            .append("rect")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .style("stroke", "white")
            .style("fill", function(d) {
               return d3.interpolateBlues((d.value / root.value*2)+0.5); // to change the color it's here 
            })
            // used chatgpt to understand how to use a toolkit to showcase a text of how many medals for each section 
            .on("mouseover", function(d) {
                treetooltip
                    .style("display", "block")
                    .html(`<strong>${d.data.name}</strong><br># of Medals: ${d.value}`);
            })
            .on("mousemove", function() {
                treetooltip
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY + 30) + "px");
            })
            .on("mouseout", function() {
                treetooltip.style("display", "none");
            });

        // all the names for each rectangle
        svg.selectAll("text").data(root.leaves()).enter()
            .append("text")
                .attr("x", d => d.x0 + 3)
                .attr("y", d => d.y0 + 20)
                .text(d => d.data.name)
                .attr("font-size", "12px")
                .attr("fill", "white")
})};
// end of treemap

/**
 * The beginning of the sankey chart function.
 * This function draws the sankey chart for a given country name. This is called when the user clicks on country on the map.
 * @param {*} countryName The country name of the country the user clicks on.
 */
function drawSankey(countryName) {

    d3.csv("dataset/medals.csv", function(error, rawData) {
        if (error) throw error;

        //sankey chart dimensions
        const width = document.getElementById("sidebar-container").clientWidth;
        const height = 500;
        // added some scaling to customize fit into the sidebar container
        const sankeyMargin = { top: height * 0.05, right: width * 0.05, bottom: 0, left: width * 0.2 };
        const sankeyWidth = width - sankeyMargin.left - sankeyMargin.right;
        const sankeyHeight = height - sankeyMargin.top - sankeyMargin.bottom;
       
        // color mapping for medal type
        const color = d3.scaleOrdinal()
            .domain(["Gold Medal", "Silver Medal", "Bronze Medal"])
            .range(["#FFD700", "#C0C0C0", "#CD7F32"]);

        const medalColors = new Set(["Gold Medal", "Silver Medal", "Bronze Medal"])

        // sankey chart setup
        const sankeygraph = d3.sankey()
            .nodeWidth(20)
            .nodePadding(10)
            .size([sankeyWidth, sankeyHeight]);

        // create a set of nodes and links
        const nodesSet = new Set();
        const linkCounts = {};

        // filters the data for only the selected country
        const country = rawData.filter(d => d.country === countryName);
        
        // used the similar code from the treemap function for consistency
        const countDisciplines = {}; 

        country.forEach(d => {
        if (!countDisciplines[d.discipline]) {
            countDisciplines[d.discipline] = 0;
        } 
            countDisciplines[d.discipline]++;
        });

        // selects the top 10 disciplines based on the number of medals won
        const top10 = new Set(
            Object.entries(countDisciplines)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([discipline]) => discipline));

        // color mapping for top 10 disciplines
        const top10color = d3.scaleOrdinal()
            .domain(top10)
            .range(d3.schemeTableau10);

        // creates the nodes and links for the sankey chart
        country.forEach(d => {
            if (top10.has(d.discipline)) {
            const source = d.medal_type; 
            const target = d.discipline;
            nodesSet.add(source);
            nodesSet.add(target);

            const key = `${source}->${target}`;
            linkCounts[key] = (linkCounts[key] || 0) + 1;
            }
        });

        // maps the nodes and links to the sankey chart format
        const nodes = Array.from(nodesSet).map(name => ({ name }));
        const nameToIndex = Object.fromEntries(nodes.map((d, i) => [d.name, i]));

        const links = Object.entries(linkCounts).map(([key, value]) => {
            const [src, tgt] = key.split("->");
            return {
                source: nameToIndex[src],
                target: nameToIndex[tgt],
                value: value
            };
        });

        // positions the nodes and links in the sankey chart
        const graph = sankeygraph({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links
        });

        // new svg for the sankey to fit into sidebar container
        const svg = d3.select("#sidebar-container").append("svg")
            .attr("id", "sankey-svg") 
            .attr("width", width)
            .attr("height", height);

        // draws the paths between the nodes 
        const sankeyGroup = svg.append("g")
            .attr("transform", `translate(${sankeyMargin.left}, ${sankeyMargin.top})`);

        // assign new tooltip specific to the sankey
        const sankeytooltip = d3.select("#sankey-tooltip");

        // add the links and tooltips
        sankeyGroup.append("g")
            .attr("fill", "none")
            .selectAll("path")
            .data(graph.links)
            .enter().append("path") // replaced this instead of join because v4 
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("stroke-width", d => Math.max(1, d.width))
            .attr("stroke", d => color(d.source.name))
            .attr("opacity", 0.7)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                console.log("clicked on", d.source.name, "->", d.target.name);
            })
            .on("mouseover", function(d) { // changed this to a function bc of v4, make consistent with treemap
                sankeytooltip.style("display", "block")
                   .html(`<strong>${d.target.name} → ${d.source.name} </strong> <br># of Medals: ${d.value}`);
            })
            .on("mousemove", event => {
                sankeytooltip
             .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY + 30) + "px");
            })
            .on("mouseout", () => {
                sankeytooltip.style("display", "none")});

        // draws the nodes in the sankey chart
        const node = sankeyGroup.append("g")
            .selectAll("g") 
            .data(graph.nodes)
            .enter(); // changed this because v4 doesnt use join, 


        // styles and adds the rectangles for each node
        node.append("rect")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => medalColors.has(d.name) ? color(d.name) : top10color(d.name))
            .attr("stroke", "#000");

        // adds the labels for each node
        node.append("text")
            .attr("x", d => d.x0 - 5)
            .attr("y", d => (d.y0 + d.y1) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", "end")
            .attr("font-size", 12)
            .attr("stroke", "white")  // adding the white around the text for each node for easier visibility
            .attr("stroke-width", 2.5)       
            .attr("paint-order", "stroke") 
            .attr("fill", "black") 
            .attr('stroke-linejoin', 'round')
            .text(d => d.name);

        });
}
// end of sankey

// Continue the world map -> Draw countries on the map
g.selectAll("path")
    .data(topo.features)
    .enter()
    .append("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", function(d) {
    var country = medalData.get(d.id);
    var total = (country && country.total) ? country.total : 0;
        return total === 0 ? "#e0e0e0" : colorScale(total);
    })
    .attr("stroke", "white")
    .attr("stroke-width", "0.7px")
    .on("mouseover", function(d) {
    var country = medalData.get(d.id) || {
        name: d.properties.name,
        gold: 0, silver: 0, bronze: 0, total: 0
    };
d3.select(this)
    .attr("stroke-width", "1.5px");

tooltip.html(`
    <div class="tooltip-title">${country.name}</div>
    <div class="tooltip-value">🥇 ${country.gold} 🥈 ${country.silver} 🥉 ${country.bronze}</div>
    <div class="tooltip-total">Total: ${country.total}</div>
`).style("opacity", 1);
})
    .on("mousemove", function() {
    const [x, y] = d3.mouse(svg.node()); 
    tooltip
    .style("left", (x + 8) + "px")
    .style("top", (y + 30) + "px");
    })
    .on("mouseout", function() {
    d3.select(this).attr("stroke-width", "0.7px");
    tooltip.style("opacity", 0);
    })
    .on("click", function(d) {
    g.selectAll(".country").classed("selected", false);
    
d3.select(this)
    .classed("selected", true)
    .raise();
    
    // added this to access the country name and call the draw treemap / sankey chart functions
    var country = medalData.get(d.id) || {
        name: d.properties.name,
        gold: 0, silver: 0, bronze: 0, total: 0,
        shortName: d.country
    };
    
    // Zoom-in coordinates
    const bounds = path.bounds(d);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.max(1, Math.min(4, 0.7 / Math.max(dx / width, dy / height)));
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // Makes the transition for the zoom in
    g.transition()
        .duration(750)
        .attr("transform", `translate(${translate}) scale(${scale})`);

    // connect the ID by country make the name pop up when selected
    document.getElementById("country").textContent = "Country: " + (country.name);

    // remove the svg # when selecting different chart on the dropdown menu
    d3.select("#sidebar-container").select("#treemap-svg").remove();
    d3.select("#sidebar-container").select("#sankey-svg").remove();

    // get visualizations based on the country
    selectedCountryName = country.shortName; // store to use when changing between charts
    const selectedChart = document.getElementById("viz-select").value;

    // only show the chart if it has data to show
    if (country.total > 0) {
        d3.select("#sidebar-container").text("");
        if (selectedChart === "treemap") {
            drawTreemap(selectedCountryName);
        } else if (selectedChart === "sankey") {
            drawSankey(selectedCountryName) 
        }
    // give a message if the information / charts are not available.
    } else if (country.total === 0) {
        document.getElementById("sidebar-container").textContent = `No medal data avilable for ${country.name}.`;
    }

    });

// this changes the charts when interacting with the viz select (dropdown)
d3.select("#viz-select").on("change", function() {
    
    selectedChart = this.value;

    if (selectedCountryName) {
        // removes the previous chart / item to make space for the new one based on dropdown selection and information
        d3.select("#sidebar-container").select("#treemap-svg").remove();
        d3.select("#sidebar-container").select("#sankey-svg").remove();
        d3.select("#sidebar-container").text("");

        // draws the chart selected
        if (selectedChart === "treemap") {
            drawTreemap(selectedCountryName);
        } else if (selectedChart === "sankey") {
            drawSankey(selectedCountryName);
        }
    }
});


// legend
var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(30,30)");

var defs = svg.append("defs");
var gradient = defs.append("linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", "100%").attr("y2", "0%");

gradient.selectAll("stop")
.data([
    { offset: "0%", color: customInterpolateBlues(0) },
    { offset: "100%", color: customInterpolateBlues(1) }
])
    .enter().append("stop")
    .attr("offset", d => d.offset)
    .attr("stop-color", d => d.color);

legend.append("rect")
    .attr("width", 200)
    .attr("height", 20)
    .style("fill", "url(#gradient)");

var x = d3.scaleLinear()
    .domain([0, maxMedals])
    .range([0, 200]);

legend.append("g")
    .attr("transform", "translate(0,20)")
    .call(d3.axisBottom(x).ticks(5));

legend.append("text")
    .attr("x", 100)
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .text("Total Medals");
});