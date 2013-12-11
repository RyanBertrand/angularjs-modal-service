angular.module('fundoo.services', []).factory('createDialog', ["$document", "$compile", "$rootScope", "$controller", "$timeout",
    function ($document, $compile, $rootScope, $controller, $timeout) {
        var defaults = {
            id: null,
            template: null,
            templateUrl: null,
            title: 'Default Title',
            backdrop: true,
            success: {label: 'OK', fn: null},
            cancel: {label: 'Close', fn: null},
            controller: null, //just like route controller declaration
            backdropClass: "modal-backdrop",
            footerTemplate: null,
            modalClass: "modal",
            css: {

            },
            showHeader: false,
            showHeaderCloseButton: true,
            removeOnDismiss: true,
            allowKeyboardDismiss: true,
            allowBackdropDismiss: true
        };
        var body = $document.find('body');

        return function Dialog(templateUrl/*optional*/, options, passedInLocals) {

            // Handle arguments if optional template isn't provided.
            if (angular.isObject(templateUrl)) {
                passedInLocals = options;
                options = templateUrl;
            } else {
                options.templateUrl = templateUrl;
            }

            options = angular.extend({}, defaults, options); //options defined in constructor

            //Do we have an ID element?
            if (!options.id) {
                //Set the id to a random to not clash with other elements
                options.id = 'modal-' + Date.now().toString();
            }

            //DOM Builders
            var buildModalDismissOptions = function () {
                var dismissOptions = '';
                if (!options.allowBackdropDismiss) {
                    dismissOptions = ' data-backdrop="static" ';
                }
                if (!options.allowKeyboardDismiss) {
                    //For built in Boostrap ESC support
                    dismissOptions = dismissOptions + ' data-keyboard="false" ';
                }

                return dismissOptions;
            };

            var buildModalHeader = function () {
                if (options.showHeader) {
                    return '  <div class="modal-header">';
                }
                else {
                    //Add some padding for the close button
                    if (options.showHeaderCloseButton) {
                        return '<div style="height: 22px; padding-right: 10px">';
                    }
                    else {
                        return '<div>';
                    }
                }
            };

            var buildModalBody = function () {
                if (options.template) {
                    if (angular.isString(options.template)) {
                        // Simple string template
                        return '<div class="modal-body">' + options.template + '</div>';
                    } else {
                        // jQuery/JQlite wrapped object
                        return '<div class="modal-body">' + options.template.html() + '</div>';
                    }
                } else {
                    // Template url
                    return '<div class="modal-body" ng-include="\'' + options.templateUrl + '\'"></div>'
                }
            };

            var buildModalFooter = function () {
                var footerContents = null;
                if (options.footerTemplate) {
                    footerContents = options.footerTemplate;
                }
                else {
                    //Default Footer
                    footerContents = '<button class="btn" ng-click="$modalCancel()">{{$modalCancelLabel}}</button>' +
                        '<button class="btn btn-primary" ng-click="$modalSuccess()">{{$modalSuccessLabel}}</button>';
                }

                return '<div class="modal-footer">' +
                    footerContents +
                    '</div>';
            };

            var key;
            var idAttr = ' id="' + options.id + '" ';
            var modalElementID = '#' + options.id;

            var dismissOptions = buildModalDismissOptions();
            var modalHeader = buildModalHeader();
            var modalBody = buildModalBody();
            var modalFooter = buildModalFooter();

            //We don't have the scope we're gonna use yet, so just get a compile function for modal
            var modalEl = angular.element(
                '<div class="' + options.modalClass + ' fade"' + idAttr + dismissOptions + '>' +
                    '<div class="modal-dialog"><div class="modal-content">' +
                    modalHeader +
                    '    <button ng-show="$showHeaderCloseButton" type="button" class="close" ng-click="$modalCancel()">&times;</button>' +
                    '    <h2 ng-show="$showHeader">{{$title}}</h2>' +
                    '  </div>' +
                    modalBody +
                    modalFooter +
                    '</div></div></div>');

            for (key in options.css) {
                modalEl.css(key, options.css[key]);
            }

            var handleEscPressed = function (event) {
                if (event.keyCode === 27) {
                    scope.$modalCancel();
                }
            };

            var closeFn = function () {
                if (options.allowKeyboardDismiss) {
                    body.unbind('keydown', handleEscPressed);
                }

                $(modalElementID).modal('hide');
            };

            if (options.allowKeyboardDismiss) {
                body.bind('keydown', handleEscPressed);
            }


            var ctrl, locals,
                scope = options.scope || $rootScope.$new();

            scope.$title = options.title;
            scope.$showHeader = options.showHeader;
            scope.$showHeaderCloseButton = options.showHeaderCloseButton;
            scope.$modalClose = closeFn;
            scope.$modalCancel = function () {
                var callFn = options.cancel.fn || closeFn;
                callFn.call(this);
                scope.$modalClose();
            };
            scope.$modalSuccess = function () {
                var callFn = options.success.fn || closeFn;
                callFn.call(this);
                scope.$modalClose();
            };
            scope.$modalSuccessLabel = options.success.label;
            scope.$modalCancelLabel = options.cancel.label;

            if (options.controller) {
                locals = angular.extend({$scope: scope}, passedInLocals);
                ctrl = $controller(options.controller, locals);
                // Yes, ngControllerController is not a typo
                modalEl.contents().data('$ngControllerController', ctrl);
            }

            $compile(modalEl)(scope);
            body.append(modalEl);

            $timeout(function () {
                $(modalElementID).modal('show');
            }, 200);


            if (options.removeOnDismiss) {
                //Setup the Bootstrap callback to remove from the modal when dismissed
                $(modalElementID).on('hidden.bs.modal', function () {
                    //Remove from the DOM
                    var elem = document.getElementById(options.id);
                    elem.parentNode.removeChild(elem);
                });
            }
        };
    }]);
