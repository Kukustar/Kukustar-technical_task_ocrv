import React from "react";

import * as d3 from "d3";
import "../styles/App.css";

const App = () => {
  var radius = 40;

  const states = [
    { x: 43, y: 67, label: "first", transitions: [] },
    { x: 340, y: 150, label: "second", transitions: [] },
    { x: 200, y: 250, label: "third", transitions: [] },
    { x: 300, y: 320, label: "fourth", transitions: [] },
    { x: 50, y: 250, label: "fifth", transitions: [] },
    { x: 90, y: 170, label: "last", transitions: [] }
  ];

  states[0].transitions.push({
    label: "whooo",
    points: [
      { x: 150, y: 50 },
      { x: 200, y: 30 }
    ],
    target: states[1]
  });

  states[1].transitions.push({
    label: "waaa!",
    points: [{ x: 250, y: 30 }],
    target: states[2]
  });

  window.svg = d3
    .select("body")
    .append("svg")
    .attr("width", "960px")
    .attr("height", "500px");

  // define arrow markers for graph links
  svg
    .append("svg:defs")
    .append("svg:marker")
    .attr("id", "end-arrow")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 4)
    .attr("markerWidth", 8)
    .attr("markerHeight", 8)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("class", "end-arrow");

  // line displayed when dragging new nodes
  const drag_line = svg.append("svg:path").attr({
    class: "dragline hidden",
    d: "M0,0L0,0"
  });
  var gTransitions = svg.append("g").selectAll("path.transition");
  var gStates = svg.append("g").selectAll("g.state");

  var transitions = function() {
    return states.reduce(function(initial, state) {
      return initial.concat(
        state.transitions.map(function(transition) {
          return { source: state, transition: transition };
        })
      );
    }, []);
  };

  var transformTransitionEndpoints = function(d, i) {
    var endPoints = d.endPoints();

    var point = [
      d.type == "start" ? endPoints[0].x : endPoints[1].x,
      d.type == "start" ? endPoints[0].y : endPoints[1].y
    ];

    return "translate(" + point + ")";
  };

  var transformTransitionPoints = function(d, i) {
    return "translate(" + [d.x, d.y] + ")";
  };

  var computeTransitionPath = (function() {
    var line = d3.svg
      .line()
      .x(function(d, i) {
        return d.x;
      })
      .y(function(d, i) {
        return d.y;
      })
      .interpolate("cardinal");

    return function(d) {
      var source = d.source,
        target =
          (d.transition.points.length && d.transition.points[0]) ||
          d.transition.target,
        deltaX = target.x - source.x,
        deltaY = target.y - source.y,
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
        normX = deltaX / dist,
        normY = deltaY / dist,
        sourcePadding = radius + 4, //d.left ? 17 : 12,
        sourceX = source.x + sourcePadding * normX,
        sourceY = source.y + sourcePadding * normY;

      source =
        (d.transition.points.length &&
          d.transition.points[d.transition.points.length - 1]) ||
        d.source;
      target = d.transition.target;
      deltaX = target.x - source.x;
      deltaY = target.y - source.y;
      dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      normX = deltaX / dist;
      normY = deltaY / dist;
      var targetPadding = radius + 8; //d.right ? 17 : 12,
      var targetX = target.x - targetPadding * normX;
      var targetY = target.y - targetPadding * normY;

      var points = [{ x: sourceX, y: sourceY }].concat(d.transition.points, [
        { x: targetX, y: targetY }
      ]);
      var l = line(points);

      return l;
    };
  })();

  var dragPoint = d3.behavior.drag().on("drag", function(d, i) {
    console.log("transitionmidpoint drag");
    var gTransitionPoint = d3.select(this);

    gTransitionPoint.attr("transform", function(d, i) {
      d.x += d3.event.dx;
      d.y += d3.event.dy;
      return "translate(" + [d.x, d.y] + ")";
    });

    // refresh transition path
    gTransitions.selectAll("path").attr("d", computeTransitionPath);
    // refresh transition endpoints
    gTransitions.selectAll("circle.endpoint").attr({
      transform: transformTransitionEndpoints
    });

    // refresh transition points
    gTransitions.selectAll("circle.point").attr({
      transform: transformTransitionPoints
    });

    d3.event.sourceEvent.stopPropagation();
  });

  var renderTransitionMidPoints = function(gTransition) {
    gTransition.each(function(transition) {
      var transitionPoints = d3
        .select(this)
        .selectAll("circle.point")
        .data(transition.transition.points, function(d) {
          return transition.transition.points.indexOf(d);
        });

      transitionPoints
        .enter()
        .append("circle")
        .attr({
          class: "point",
          r: 4,
          transform: transformTransitionPoints
        })
        .on({
          dblclick: function(d) {
            console.log("transitionmidpoint dblclick");

            var gTransition = d3.select(d3.event.target.parentElement),
              transition = gTransition.datum(),
              index = transition.transition.points.indexOf(d);

            if (gTransition.classed("selected")) {
              transition.transition.points.splice(index, 1);

              gTransition.selectAll("path").attr({
                d: computeTransitionPath
              });

              renderTransitionMidPoints(gTransition);

              //renderTransitionPoints( gTransition);
              gTransition.selectAll("circle.endpoint").attr({
                transform: transformTransitionEndpoints
              });
            }
            d3.event.stopPropagation();
          }
        })
        .call(dragPoint);
      transitionPoints.exit().remove();
    });
  };

  var renderTransitionPoints = function(gTransition) {
    gTransition.each(function(d) {
      var endPoints = function() {
        var source = d.source,
          target =
            (d.transition.points.length && d.transition.points[0]) ||
            d.transition.target,
          deltaX = target.x - source.x,
          deltaY = target.y - source.y,
          dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
          normX = deltaX / dist,
          normY = deltaY / dist,
          sourceX = source.x + radius * normX,
          sourceY = source.y + radius * normY;

        source =
          (d.transition.points.length &&
            d.transition.points[d.transition.points.length - 1]) ||
          d.source;
        target = d.transition.target;
        deltaX = target.x - source.x;
        deltaY = target.y - source.y;
        dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        normX = deltaX / dist;
        normY = deltaY / dist;
        var targetPadding = radius + 8; //d.right ? 17 : 12,
        var targetX = target.x - radius * normX;
        var targetY = target.y - radius * normY;

        return [
          { x: sourceX, y: sourceY },
          { x: targetX, y: targetY }
        ];
      };

      var transitionEndpoints = d3
        .select(this)
        .selectAll("circle.endpoint")
        .data([
          { endPoints: endPoints, type: "start" },
          { endPoints: endPoints, type: "end" }
        ]);

      transitionEndpoints
        .enter()
        .append("circle")
        .attr({
          class: function(d) {
            return "endpoint " + d.type;
          },
          r: 4,
          transform: transformTransitionEndpoints
        });
      transitionEndpoints.exit().remove();
    });
  };

  var renderTransitions = function() {
    var gTransition = gTransitions
      .enter()
      .append("g")
      .attr({
        class: "transition"
      })
      .on({
        click: function() {
          console.log("transition click");
          d3.selectAll("g.state.selection").classed("selection", false);
          d3.selectAll("g.selected").classed("selected", false);

          d3.select(this).classed("selected", true);
          d3.event.stopPropagation();
        },
        mouseover: function() {
          svg.select("rect.selection").empty() &&
            d3.select(this).classed("hover", true);
        },
        mouseout: function() {
          svg.select("rect.selection").empty() &&
            d3.select(this).classed("hover", false);
        }
      });
    gTransition
      .append("path")
      .attr({
        d: computeTransitionPath,
        class: "background"
      })
      .on({
        dblclick: function(d, i) {
          gTransition = d3.select(d3.event.target.parentElement);
          if (d3.event.ctrlKey) {
            var p = d3.mouse(this);

            gTransition.classed("selected", true);
            d.transition.points.push({ x: p[0], y: p[1] });

            renderTransitionMidPoints(gTransition, d);
            gTransition.selectAll("path").attr({
              d: computeTransitionPath
            });
          } else {
            var gTransition = d3.select(d3.event.target.parentElement),
              transition = gTransition.datum(),
              index = transition.source.transitions.indexOf(
                transition.transition
              );

            transition.source.transitions.splice(index, 1);
            gTransition.remove();

            d3.event.stopPropagation();
          }
        }
      });

    gTransition.append("path").attr({
      d: computeTransitionPath,
      class: "foreground"
    });

    renderTransitionPoints(gTransition);
    renderTransitionMidPoints(gTransition);

    gTransitions.exit().remove();
  };

  var renderStates = function() {
    var gState = gStates
      .enter()
      .append("g")
      .attr({
        transform: function(d) {
          return "translate(" + [d.x, d.y] + ")";
        },
        class: "state"
      })
      .call(drag);

    gState
      .append("circle")
      .attr({
        r: radius + 4,
        class: "outer"
      })
      .on({
        mousedown: function(d) {
          console.log("state circle outer mousedown");
          // (startState = d), (endState = undefined);
          var a = (function() {
              startState = d;
              endState = undefined;
            })();
          
          // reposition drag line
          drag_line
            .style("marker-end", "url(#end-arrow)")
            .classed("hidden", false)
            .attr("d", "M" + d.x + "," + d.y + "L" + d.x + "," + d.y);

          // force element to be an top
          this.parentNode.parentNode.appendChild(this.parentNode);
          //d3.event.stopPropagation();
        },
        mouseover: function() {
          svg.select("rect.selection").empty() &&
            d3.select(this).classed("hover", true);

          // http://stackoverflow.com/questions/9956958/changing-the-position-of-bootstrap-popovers-based-on-the-popovers-x-position-in
          // http://bl.ocks.org/zmaril/3012212
          // $( this).popover( "show");
        },
        mouseout: function() {
          svg.select("rect.selection").empty() &&
            d3.select(this).classed("hover", false);
          //$( this).popover( "hide");
        }
      });
    gState
      .append("circle")
      .attr({
        r: radius,
        class: "inner"
      })
      .on({
        click: function(d, i) {
          console.log("state circle inner mousedown");

          var e = d3.event,
            g = this.parentNode,
            isSelected = d3.select(g).classed("selected");

          if (!e.ctrlKey) {
            d3.selectAll("g.selected").classed("selected", false);
          }

          d3.select(g).classed("selected", !isSelected);

          // reappend dragged element as last
          // so that its stays on top
          g.parentNode.appendChild(g);
          //d3.event.stopPropagation();
        },
        mouseover: function() {
          svg.select("rect.selection").empty() &&
            d3.select(this).classed("hover", true);
        },
        mouseout: function() {
          svg.select("rect.selection").empty() &&
            d3.select(this).classed("hover", false);
        },
        dblclick: function() {
          console.log("state circle outer dblclick");
          var d = d3.select(this.parentNode).datum();

          var index = states.indexOf(d);
          states.splice(index, 1);

          // remove transitions targeting the removed state
          states.forEach(function(state) {
            state.transitions.forEach(function(transition, index) {
              if (transition.target === d) {
                state.transitions.splice(index, 1);
              }
            });
          });

          //console.log( "removed state " + d.label);

          //d3.select( this.parentNode).remove();
          update();
        }
      });
    gState
      .append("text")
      .attr({
        "text-anchor": "middle",
        y: 4
      })
      .text(function(d) {
        return d.label;
      });

    gState.append("title").text(function(d) {
      return d.label;
    });
    gStates.exit().remove();
  };

  var startState, endState;
  var drag = d3.behavior
    .drag()
    .on("drag", function(d, i) {
      console.log("drag");
      if (startState) {
        return;
      }

      var selection = d3.selectAll(".selected");

      // if dragged state is not in current selection
      // mark it selected and deselect all others
      if (selection[0].indexOf(this) == -1) {
        selection.classed("selected", false);
        selection = d3.select(this);
        selection.classed("selected", true);
      }

      // move states
      selection.attr("transform", function(d, i) {
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        return "translate(" + [d.x, d.y] + ")";
      });

      // move transistion points of each transition
      // where transition target is also in selection
      var selectedStates = d3.selectAll("g.state.selected").data();
      var affectedTransitions = selectedStates
        .reduce(function(array, state) {
          return array.concat(state.transitions);
        }, [])
        .filter(function(transition) {
          return selectedStates.indexOf(transition.target) != -1;
        });
      affectedTransitions.forEach(function(transition) {
        for (var i = transition.points.length - 1; i >= 0; i--) {
          var point = transition.points[i];
          point.x += d3.event.dx;
          point.y += d3.event.dy;
        }
      });

      // reappend dragged element as last
      // so that its stays on top
      selection.each(function() {
        this.parentNode.appendChild(this);
      });

      // refresh transition path
      gTransitions.selectAll("path").attr("d", computeTransitionPath);

      // refresh transition endpoints
      gTransitions.selectAll("circle.endpoint").attr({
        transform: transformTransitionEndpoints
      });
      // refresh transition points
      gTransitions.selectAll("circle.point").attr({
        transform: transformTransitionPoints
      });

      d3.event.sourceEvent.stopPropagation();
    })
    .on("dragend", function(d) {
      console.log("dragend");
      // TODO : http://stackoverflow.com/questions/14667401/click-event-not-firing-after-drag-sometimes-in-d3-js

      // needed by FF
      drag_line.classed("hidden", true).style("marker-end", "");

      if (startState && endState) {
        startState.transitions.push({
          label: "transition label 1",
          points: [],
          target: endState
        });
        update();
      }

      startState = undefined;
      d3.event.sourceEvent.stopPropagation();
    });

  svg.on({
    mousedown: function() {
      console.log("mousedown", d3.event.target);
      if (d3.event.target.tagName == "svg") {
        if (!d3.event.ctrlKey) {
          d3.selectAll("g.selected").classed("selected", false);
        }

        var p = d3.mouse(this);

        svg.append("rect").attr({
          rx: 6,
          ry: 6,
          class: "selection",
          x: p[0],
          y: p[1],
          width: 0,
          height: 0
        });
      }
    },
    mousemove: function() {
      //console.log( "mousemove");
      var p = d3.mouse(this),
        s = svg.select("rect.selection");

      if (!s.empty()) {
        var d = {
            x: parseInt(s.attr("x"), 10),
            y: parseInt(s.attr("y"), 10),
            width: parseInt(s.attr("width"), 10),
            height: parseInt(s.attr("height"), 10)
          },
          move = {
            x: p[0] - d.x,
            y: p[1] - d.y
          };
        if (move.x < 1 || move.x * 2 < d.width) {
          d.x = p[0];
          d.width -= move.x;
        } else {
          d.width = move.x;
        }

        if (move.y < 1 || move.y * 2 < d.height) {
          d.y = p[1];
          d.height -= move.y;
        } else {
          d.height = move.y;
        }

        s.attr(d);

        // deselect all temporary selected state objects
        d3.selectAll("g.state.selection.selected").classed("selected", false);

        d3.selectAll("g.state >circle.inner").each(function(state_data, i) {
          if (
            !d3.select(this).classed("selected") &&
            // inner circle inside selection frame
            state_data.x - radius >= d.x &&
            state_data.x + radius <= d.x + d.width &&
            state_data.y - radius >= d.y &&
            state_data.y + radius <= d.y + d.height
          ) {
            d3.select(this.parentNode)
              .classed("selection", true)
              .classed("selected", true);
          }
        });
      } else if (startState) {
        // update drag line
        drag_line.attr(
          "d",
          "M" + startState.x + "," + startState.y + "L" + p[0] + "," + p[1]
        );

        var state = d3.select("g.state .inner.hover");
        endState = (!state.empty() && state.data()[0]) || undefined;
      }
    },
    mouseup: function() {
      console.log("mouseup");
      // remove selection frame
      svg.selectAll("rect.selection").remove();

      // remove temporary selection marker class
      d3.selectAll("g.state.selection").classed("selection", false);
    },
    mouseout: function() {
      if (!d3.event.relatedTarget || d3.event.relatedTarget.tagName == "HTML") {
        // remove selection frame
        svg.selectAll("rect.selection").remove();

        // remove temporary selection marker class
        d3.selectAll("g.state.selection").classed("selection", false);
      }
    },
    dblclick: function() {
      console.log("dblclick");
      var p = d3.mouse(this);

      if (d3.event.target.tagName == "svg") {
        states.push({ x: p[0], y: p[1], label: "tst", transitions: [] });
        update();
      }
    }
  });

  update();

  function update() {
    gStates = gStates.data(states, function(d) {
      return states.indexOf(d);
    });
    renderStates();

    var _transitions = transitions();
    gTransitions = gTransitions.data(_transitions, function(d) {
      return _transitions.indexOf(d);
    });
    renderTransitions();
  }
  return <React.Fragment />;
};

export default App;
