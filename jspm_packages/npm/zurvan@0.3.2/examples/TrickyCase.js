"use strict";
var assert = require("assert");
var zurvan = require("../zurvan");
var TimeUnit = require("../TimeUnit");

/*
  Example below is the trickies case zurvan may be used - the set of setImmediate/process.nextTick
  make a loop around the event loop, effectively bypassing zurvan's mechanisms for waiting for empty queue.
  Please make sure that your code does not execute such a cycle - if it does (it may and still be fine)
  the please increase number of requested cycles (numberOfCyclesOnEventLoop configuration parameter)
  
  Mocha structure is used to make sure that examples will stay up-to-date with library code
*/

describe('zurvan tricky example', function() {
  it('single loop failure', function() {	
	var holder = [];
	var i = 0;
	
	return zurvan.interceptTimers()  
      .then(function() {
		setImmediate(function() {
		  holder.push(i++);
		  
		  process.nextTick(function() {
			holder.push(i++);  
			
			setImmediate(function() {
				holder.push(i++);
				process.nextTick(function() {
					holder.push(i++);
					setImmediate(function() {
					  holder.push(i++);
					  process.nextTick(function() {
						holder.push(i++);
						setImmediate(function() {
							holder.push(i++);
							process.nextTick(function() {
							  holder.push(i++);
							  setImmediate(function() {
								holder.push(i++)  
								process.nextTick(function() {
									holder.push(i++)
									setImmediate(function() {
										holder.push(i++);
										process.nextTick(function() {
											holder.push(i++);
											setImmediate(function() {
												holder.push(i++)
												process.nextTick(function() {
													holder.push(i++)
													setImmediate(function() {
														holder.push(i++)
														process.nextTick(function() {
															holder.push(i++);
															process.nextTick(function() {
																holder.push(i++)
																process.nextTick(function() {
																	holder.push(i++)
																	setImmediate(function() {
																		holder.push(i++);
																		setImmediate(function() {
																			holder.push(i++);
																			setImmediate(function() {
																				holder.push(i++)
																				process.nextTick(function() {
																					holder.push(i++)
																					Promise.resolve().
																					then(function() {
																						holder.push(i++);
																					}).then(function() {
																						holder.push(i++)
																					})
																				})
																			})
																		})
																	})
																})
															})
														})
													})
												})
											})
										})
									})
								})
							  })
							})
						})
					  })
					})
				})
			})
		  })
		})
		
    	return zurvan.waitForEmptyQueue();
	  }).then(function() {  
	    // placeholder was filled before resolving advancing promise
	    assert(holder.length === i);
	  
	    // perform cleanup
	    return zurvan.releaseTimers();
	  });	
  });
});