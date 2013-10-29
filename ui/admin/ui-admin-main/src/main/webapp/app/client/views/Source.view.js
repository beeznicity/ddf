/**
 * Copyright (c) Codice Foundation
 *
 * This is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser
 * General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details. A copy of the GNU Lesser General Public License
 * is distributed along with this program and can be found at
 * <http://www.gnu.org/licenses/lgpl.html>.
 *
 **/
var SourcePage = Backbone.View.extend({
    events: {
        'click .refreshButton' : 'refreshSources',
        'click .addSourceLink' : 'addSource'
    },
    initialize: function() {
        _.bindAll(this, "refreshSources");
    },
    render: function() {
        this.$el.html(ich.listTemplate(sList.toJSON()));
        var sTable = new SourceTable({
            collection: sList,
            el: this.$el.children(".sourcesTable").children("tbody")
        });
        sTable.render();
        return this;
    },
    refreshSources: function() {
        sList.fetch();
    },
    addSource: function() {
        var msfView = new ManagedServiceFactoryView({managedServiceFactoryList: msfList});
        $("#main").html(msfView.render().el);
    }
});

var SourceTable = Backbone.View.extend({
    sourceRows: [],
    initialize: function(){
        _.bindAll(this, 'appendSource', 'render', 'removeSource', 'changeSource');
        this.collection.bind("add", this.appendSource);
        this.collection.bind("remove", this.removeSource);
        this.collection.bind("change", this.changeSource);
    },
    render: function() {
        for(var m in this.collection.models){
            var newRow = new SourceRow({model: this.collection.models[m]});
            this.sourceRows.push(newRow);
            this.$el.append(newRow.render().el);
        }
        return this;
    },
    appendSource: function(s) {
        var newRow = new SourceRow({model: s});
        this.sourceRows.push(newRow);
        this.$el.append(newRow.render().el);
    },
    removeSource: function(s) {
        for(var i in this.sourceRows) {
            if(this.sourceRows[i].model.id == s.id) {
                this.sourceRows[i].remove();
                this.sourceRows.splice(i,1);
                break;
            }
        }
    },
    changeSource: function(change) {
        this.removeSource(change);
        this.appendSource(new Source(change.attributes));
    }
});

var SourceRow = Backbone.View.extend({
    tagName: "tr",
    events: {
        'click .editLink' : 'editSource',
        'click .removeLink' : 'removeSource'
    },
    render: function() {
        //just build a temp object to hold the data how the template wants it
        var sourceRowObj = {};
        sourceRowObj["name"] = this.model.get("sourceId") ?
            this.model.get("sourceId") : this.model.configuration.get("shortname") ?
            this.model.configuration.get("shortname") : this.model.id;
        sourceRowObj["type"] = this.model.get("name");

        var available = this.model.get("available");
        if(available === true) {
            sourceRowObj["statusClass"] = "label label-success";
            sourceRowObj["status"] = "Available";
        }
        else if(available === false) {
            sourceRowObj["statusClass"] = "label label-important";
            sourceRowObj["status"] = "Not Available";
        }
        else if(!available) {
            sourceRowObj["statusClass"] = "label disabled";
            sourceRowObj["status"] = "Unknown";
        }

        if(this.model.configuration && this.model.configuration.get("service.pid")) {
            sourceRowObj["configuration"] = true;
        }

        this.$el.html(ich.sourceRow(sourceRowObj));
        return this;
    },
    editSource: function() {
        //we can edit either managed service factories or managed services
        if(this.model.get("fpid"))
        {
            var federatedView = new ManagedServiceFactoryView({sourceModel:this.model, managedServiceFactoryList: msfList});
            $("#main").html(federatedView.render().el);
        }
        else
        {
            var federatedView = new ManagedServiceView({sourceModel:this.model, managedServiceList: msList});
            $("#main").html(federatedView.render().el);
        }
    },
    removeSource: function() {
        var viewModel = this;
        var question = "Are you sure you want to remove the configuration: "+viewModel.model.configuration.get("service.pid")+"?";
        var confirmation = window.confirm(question);
        if(confirmation) {
            this.model.configuration.destroy();
            sList.remove(this.model);
        }
    }
});