// App component - represents the whole app
App = React.createClass({
    // This mixin makes the getMeteorData method work
    mixins: [ReactMeteorData],
    messageLimit: 160,

    componentDidMount() {
        setInterval(function () {
            this.setState({appTime: moment()});
        }.bind(this), 30000);


        Meteor.call('getIP', function (error, result) {
            if (error) {
                console.log(error);
            }
            else {
                this.setState({ip: result});
            }
        }.bind(this));
    },

    getInitialState: function () {
        Meteor.call('getRole', window.location.href, function (error, result) {
            if (error) {
                console.log(error);
            }
            else {
                console.log({role: result});
                this.setState({role: result});
            }
        }.bind(this));

        return {
            stream: this.props.stream,
            role: 'user',
            logins: [],
            messageFilter: null,
            hashtags: [],
            appTime: moment(),
            formHidden: true
        };
    },

    hasRole(role) {
        return this.state.role == role;
    },

    // Loads items from the Tasks collection and puts them on this.data.tasks
    getMeteorData() {
        var query = {};

        if (this.state.hashtags.length != 0) {
            var regexs = this.state.hashtags.map(function (el) {
                return new RegExp(el, 'i')
            });
            query["hashtags"] = {$all: regexs};
        }

        if (this.state.logins.length != 0) {
            var regexs_logins = this.state.logins.map(function (el) {
                return new RegExp(el, 'i')
            });
            query["name"] = {$in: regexs_logins};

        }

        if (this.state.messageFilter !== null) {
            query["text"] = new RegExp(this.state.messageFilter, 'gi');
        }

        if (this.state.stream !== null) {
            query["stream"] = new RegExp(this.state.stream, 'gi');
        }

        return {
            tasks: Tasks.find(query, {sort: {createdAt: -1, limit: 200}}).fetch()
        }
    },

    logoClick() {
        this.setState({stream: null});
    },

    addHashTag(hash, event) {
        var hashes = this.state.hashtags;
        var nativeEvent = event.nativeEvent;

        if (nativeEvent.ctrlKey || nativeEvent.altKey) {
            hashes.push(hash);

            // filter only unique values
            hashes = hashes.filter(function (value, index, self) {
                return self.indexOf(value) === index;
            });
        } else {
            hashes = [hash];
        }

        this.setState({hashtags: hashes})
    },

    addLogin(login) {
        var logins = this.state.logins;
        logins.push(login);

        // filter only unique values
        logins = logins.filter(function (value, index, self) {
            return self.indexOf(value) === index;
        });

        this.setState({logins: logins})
    },

    removeSelectedHashtags(hash) {
        var hashes = this.state.hashtags;
        var hashIndex = hashes.indexOf(hash);

        if (hashIndex != -1) {
            hashes.splice(hashIndex, 1);
            this.setState({hashtags: hashes});
        }
    },

    removeSelectedLogins(hash) {
        var hashes = this.state.logins;
        var hashIndex = hashes.indexOf(hash);

        if (hashIndex != -1) {
            hashes.splice(hashIndex, 1);
            this.setState({logins: hashes});
        }
    },

    selectHashtags(hashs) {
        this.setState({hashtags: hashs});
    },

    selectLogins(logins) {
        this.setState({logins: logins});
    },

    setStream(name) {
        this.setState({stream: name});
    },

    renderTasks() {
        var tasks = this.data.tasks.map((task)  => {
            return <Task key={task._id} task={task} appTime={this.state.appTime} onHashClick={this.addHashTag}
                         role={this.state.role} stream={this.state.stream} onLoginClick={this.addLogin}
                         onStreamClick={this.setStream}/>;
        });

        return <ul>{tasks}</ul>;
    },

    handleSearchSubmit(text) {
        this.selectHashtags([]);
        this.selectLogins([]);

        if (text.charAt(0) == '@') {
            this.selectLogins([text.substr(1)]);
        } else if (text.charAt(0) == '#') {
            this.selectHashtags([text]);
        } else {
            this.setState({messageFilter: text});
        }
    },

    toggleForm(hidden) {
        this.setState({formHidden: hidden});
    },

    render() {
        var canAddTweet = this.state.role == 'writer' || this.state.role == 'admin';
        var containerClass = 'container ' + (this.state.formHidden ? 'form-hidden ' : '') + (canAddTweet ? 'toggle-form-button-visible ' : '');

        return (
            <div className={containerClass}>
                <Header
                    role={this.state.role}
                    stream={this.state.stream}
                    logins={this.state.logins}
                    hashtags={this.state.hashtags}
                    toggleForm={this.toggleForm}
                    formHidden={this.state.formHidden}
                    removeSelectedLogins={this.removeSelectedLogins}
                    removeSelectedHashtags={this.removeSelectedHashtags}
                    handleSearchSubmit={this.handleSearchSubmit}
                    handleSubmit={this.handleSubmit}
                    logoClick={this.logoClick}
                    />

                {this.renderTasks()}
            </div>
        );
    }
});
