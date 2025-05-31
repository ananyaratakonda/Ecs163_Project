/*
Tree Map: 
Used https://d3-graph-gallery.com/graph/treemap_basic.html as a reference 
*/

d3.csv("dataset/medals.csv").then(data => {

let countryFilteredData = data.filter(d => d.country === "United States");

// to store all the different disciplines to then sort and find out which has the most medals 
const allDisciplines = {}; 

countryFilteredData.forEach(d => {
  if (!allDisciplines[d.discipline]) {
    allDisciplines[d.discipline] = 0;
  } 
    allDisciplines[d.discipline]++;
});

const top10 = Object.entries(allDisciplines)
  .sort((a, b) => b[1] - a[1]) // most to least
  .slice(0, 10); // I want only the top 10 

console.log("Top 10 USA events:", top10);


dataTreeMap = {
  name: "USA Medals",
  children: top10.map(([name, value]) => ({ name, value })) // need to do this so it works for the root later 
};

const svg = d3.select("svg"); // creating a SVG 

const width = 400;
const height = 800;

const root = d3.hierarchy(dataTreeMap)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

// making the actual treemap here with this function sot hat we know the width and the height 
d3.treemap()
    .size([width, height])
    .padding(4)
    (root);
const tooltip = d3.select("#tooltip");

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
        return d3.interpolateViridis(d.value / root.value); // to change the color it's here 
    })
    // i never did toolkit so used chatgpt to understand how to use a toolkit to showcase a text of how many medals for each section 
    .on("mouseover", function(d) {
        tooltip
            .style("display", "block")
            .html(`<strong>${d.data.name}</strong><br># of Medals: ${d.value}`);
    })
    .on("mousemove", function() {
        tooltip
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY + 30) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("display", "none");
    });


// all the names 
svg.selectAll("text").data(root.leaves()).enter()
    .append("text")
        .attr("x", d => d.x0 + 3)
        .attr("y", d => d.y0 + 20)
        .text(d => d.data.name)
        .attr("font-size", "12px")
        .attr("fill", "white")

});