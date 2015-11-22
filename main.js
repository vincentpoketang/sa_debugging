var the_game = null;
$(document).ready(function(){
  the_game = new game_template($('#game_container'));
  the_game.register_message_display($('#messages'));
});

var game_template = function(container){
	var self=this;
	self.actors = [];
	self.actor_count = 10;
	self.remaining_actors = self.actor_count;
	self.game_container = container;
	self.audio_sources = [];
	self.audio_sources_max = 5;
	self.message_container = null;
	self.message_text = null;
	self.backdrop = null;
	self.accuracy = 0;
	self.stats_handler = null;
	self.stats = {
		hits: 0,
		shots: 0
	};
	self.init = function(){
		for(var i=0; i<self.actor_count;i++){
		  var actor = new actor_template(self, container,i);
		  self.actors.push(actor);
		}
		self.create_sound_players();
		self.register_click_handler();
		self.stats_handler = new stats_template($('#stats'),self);
		self.start_game();
	};
	self.get_actor_count = function(){
		return self.remaining_actors;
	};
	self.get_accuracy = function(){
		return self.accuracy;
	};
	self.calculate_accuracy = function(){
		var accuracy = self.stats.hits / self.stats.shots;
		return accuracy;
	};
	self.create_sound_players = function(){
		for(var i=0; i<self.audio_sources_max; i++){
	 	var this_sound = $("<audio>");
		var this_sound_src = $("<source>",{
			src: 'sounds/gunshot.mp3',
			type: 'audio/mp3'
		});
		this_sound.append(this_sound_src);
		self.audio_sources.push(this_sound[0]);
		}
		self.game_container.append(self.actors);
	};
	self.start_game = function(){
		self.tell_actors_an_action('start_game');
	};
	self.tell_actors_an_action = function(action, parameters){
		if(typeof parameters == 'undefined'){
		  parameters = null;
		}
		for(var i=0; i<self.actors.length;i++){
		  self.actors[i][action]();
		}
	};
	self.remove_actor = function(actor){
		self.actors.splice(self.actors.indexOf(actor),1);
		if(self.actors.length==0){
			self.game_over();
		}
	};
	self.game_over = function(){
		self.display_message('You won!<br>Accuracy: %'+(self.calculate_accuracy()*100));
	};
	self.register_click_handler = function(){
		self.game_container.click(self.clicked);
	};
	self.clicked = function(){
		self.play_gunshot();
		self.add_shot();
	};
	self.add_shot = function(){
		self.stats.shots++;	
		self.accuracy = self.calculate_accuracy();
		self.stats_handler.update_stats();	
	};
	self.add_hit = function(){
		self.stats.hits++;
		self.remaining_actors--;
		self.accuracy = self.calculate_accuracy();
		self.stats_handler.update_stats();
	};
	self.play_gunshot = function(){
		var index=0;
		while(index<self.audio_sources_max && !self.audio_sources[index].paused ){ 		
			index++;
		}
		if(index<self.audio_sources_max){
			self.audio_sources[index].play();
		}
	};
	self.register_message_display = function(element){
		self.message_container = $(element);
		self.message_text = self.message_container.find('.holder');
	};
	self.display_message = function(message){
		self.backdrop = $("<div>",{
			class: 'backdrop'
		});
		self.backdrop.click(function(){
			self.hide_message();
		})
		$('body').append(self.backdrop);
		if(self.message_container!=null){
			self.message_container.show();
			self.message_text.html(message);
		}
	};
	self.hide_message = function(){
		self.backdrop.remove();
		self.backdrop=null;
		self.message_container.hide();
	};
	self.init();
	return self;
};

var stats_template = function(stats_container, game){
	var self=this;
	self.stats_container = $(stats_container);
	self.remaining_text = self.stats_container.find('.remaining > span');
	self.accuracy_text = self.stats_container.find('.accuracy > span');
	self.game = game;
	self.init = function(){
		self.update_stats();
	}
	self.update_stats = function(){
		self.remaining_text.text(game.get_actor_count());
		self.accuracy_text.text((game.get_accuracy()*100).toFixed(2)+'%');		
	}
	self.init();
	return self;
}

var actor_template = function(parent, container,index){
	var self=this;
	self.parent = parent;
	self.element = null;
	self.container = container; 
	self.heartbeat_time_max = 750;
	self.heartbeat_variance = .5;
	self.heartbeat_variance_range = self.heartbeat_time_max * self.heartbeat_variance;
	self.heartbeat_delta = Math.floor(Math.random() * (self.heartbeat_variance_range * 2)-self.heartbeat_variance_range);
	self.heartbeat_time = self.heartbeat_time_max - self.heartbeat_delta;
	self.delta_distance = 0.05;
	self.distance_to_move = null;
	self.index=index;

	self.calculate_new_heartbeat = function(){
		self.heartbeat_delta = Math.floor(Math.random()*self.heartbeat_variance_range*2)-self.heartbeat_variance_range;
		return self.heartbeat_delta;
	};
	self.create_element = function(){
		var this_element = $("<div>", {
		  class: 'actor'
		});
		var this_sound = $("<audio>");
		var this_sound_src = $("<source>",{
			src: 'sounds/turkey.wav',
			type: 'audio/wav'
		});
		this_sound.append(this_sound_src);
		this_element.append(this_sound);
		self.element = this_element;
		self.audio = this_sound[0];
		self.element.click(self.clicked);
		return self.element;
		};
		self.place_self = function(){
		self.container = $(container);
		var x = Math.floor(Math.random()*(self.container.width() - self.element.width()));
		var y = Math.floor(Math.random()*(self.container.height() - self.element.height()));

		self.distance_to_move = self.container.width()*self.delta_distance;
		self.element.css({
		  left: x+'px',
		  top: y+'px'
		});
		self.container.append(self.element);
	};
	self.check_moves = function(){
		var current_position = self.element.offset();
		var x_shift = 0;
		var y_shift = 0;
		if(current_position.left - self.distance_to_move < 0){
		  x_shift = 1;
		}
		else if(current_position.left + self.distance_to_move > self.container.width()){
		  x_shift = -1;
		}
		if(current_position.top - self.distance_to_move < 0){
		  y_shift = 1;
		}
		else if(current_position.top + self.distance_to_move > self.container.height()){
		  y_shift = -1;
		}
		return {
		  x_shift: x_shift,
		  y_shift: y_shift
		};
	};
	self.clicked = function(){
		self.add_hit();
		self.hit_sound();
		self.die();
	};
	self.add_hit = function(){
		self.parent.add_hit();
	};
	self.hit_sound = function(){
		self.audio.play();
	};
	self.die = function(){
		self.stop_heartbeat();
		self.start_delete();
	};
	self.start_delete = function(){
		self.element.css('display','none');
		setTimeout(self.full_delete,1000);
	};
	self.full_delete = function(){
		self.element.remove();
		self.parent.remove_actor(self);
		delete self;
	};
	self.move = function(){
		var shift_values = self.check_moves();
		var x_max = 3 + shift_values.x_shift;
		var x_offset = -1 + shift_values.x_shift;
		var y_max = 3 + shift_values.y_shift;
		var y_offset = -1 + shift_values.y_shift;
		var x_dir = Math.floor(Math.random()*x_max)+x_offset;
		var y_dir = Math.floor(Math.random()*y_max)+y_offset;
		self.element.animate({
		  left: '+='+(x_dir*self.distance_to_move)+'px',
		  top: '+='+(y_dir*self.distance_to_move)+'px',
		},self.heartbeat_time);
	};
	self.init = function(){
		self.create_element();
		self.place_self();
		return self;
	};
	self.start_heartbeat = function(){
		if(self.heartbeat_timer != null){
		  self.stop_heartbeat();
		}
		self.heartbeat_timer = setTimeout(self.process_heartbeat,self.heartbeat_time);
	};
	self.process_heartbeat = function(){
		self.move();
		self.calculate_new_heartbeat();
		self.start_heartbeat();
	};
	self.stop_heartbeat = function(){
		clearTimeout(self.heartbeat_timer);
		self.heartbeat_timer = null;
	};
	self.start_game = function(){
		self.start_heartbeat();
	};
	return self.init();
};