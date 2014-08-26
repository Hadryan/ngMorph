angular.module('ngMorph', [])
.directive('morphable', ['$compile', '$http', function ($compile, $http) {
  
  var configureMorphable = function (settings, callback) {
    var templatePromise;
    var ContentDimensions;

    if ( settings.template) {

      if ( settings.template.url ) {
        templatePromise = $http.get(settings.template.url);  
      }

      if ( settings.template.width && settings.template.height ) {
        ContentDimensions = {
          width: settings.template.width ? settings.template.width.replace('px', '') : null,
          height: settings.template.height ? settings.template.height.replace('px', '') : null,
        };
      }
    } 

    if ( templatePromise ) {
      templatePromise.then( function (response) {
        callback(response.data, ContentDimensions);
      });

    } else {
      callback(null, ContentDimensions);
    }

  };

  return {
    restrict: 'A',
    scope: {
      template: '@',
      settings: '=morphable'
    },
    link: function (scope, element, attrs) {
      var isMorphed = false;
      var $Morphable = element;
      var $MorphContent;
      var $MorphContentWrapper;
      var ClosingEl;
      var Morphable = $Morphable[0];
      var MorphContent;
      var MorphContentWrapper;
      var MorphableBoundingBox = $Morphable[0].getBoundingClientRect();
      var MorphContentBoundingBox;
      var MorphContentStyle;

      configureMorphable( scope.settings, function (template, ContentDimensions) {
        console.log(scope)
        // set template if url was provided instead of template attribute
        if ( !scope.template && template ) {
          scope.template = template;
        }

        // compile template
        $MorphContentWrapper = $compile('<morph-content template="{{template}}">')(scope);
        MorphContentWrapper  = $MorphContentWrapper[0];

        // get reference to inner content
        $MorphContent = angular.element(MorphContentWrapper.children[0]);
        MorphContent  = $MorphContent[0];
        
        // append the content wrapper
        $Morphable.after($MorphContentWrapper);
        MorphContentBoundingBox = MorphContent.getBoundingClientRect();
        
        // set ContentDimensions based on if values were passed in the settings
        ContentDimensions ? ContentDimensions = ContentDimensions : ContentDimensions = MorphContentBoundingBox;
        

        // set default styles for morphable
        $Morphable.css({
          'z-index': '1000',
          'outline': 'none',
          '-webkit-transition': 'opacity 0.1s 0.5s',
          'transition': 'opacity 0.1s 0.5s'
        });

        // build morph content styles
        MorphContentStyle  = {
          'position': 'fixed',
          'z-index': '900',
          'opacity': '0',
          margin: 0,
          top: MorphableBoundingBox.top + 'px',
          left: MorphableBoundingBox.left + 'px',
          height: MorphableBoundingBox.height + 'px',
          width: MorphableBoundingBox.width + 'px', 
          'pointer-events': 'none',
          '-webkit-transition': 'opacity 0.3s 0.5s, width 0.4s 0.1s, height 0.4s 0.1s, top 0.4s 0.1s, left 0.4s 0.1s, margin 0.4s 0.1s',
          'transition': 'opacity 0.3s 0.5s, width 0.4s 0.1s, height 0.4s 0.1s, top 0.4s 0.1s, left 0.4s 0.1s, margin 0.4s 0.1s'
        };

        // set morph content styles
        $MorphContentWrapper.css(MorphContentStyle);


        var addMorphedStyles = function () {
          console.log(MorphContent, ContentDimensions)
          MorphContentWrapper.style.left = MorphableBoundingBox.left + 'px';
          MorphContentWrapper.style.top = MorphableBoundingBox.top + 'px';

          setTimeout( function() {
            MorphContentWrapper.style.width = ContentDimensions.width + 'px';
            MorphContentWrapper.style.height = ContentDimensions.height + 'px';

            $Morphable.css({
              'z-index': 2000,
              'opacity': 0,
              '-webkit-transition': 'opacity 0.1s',
              'transition': 'opacity 0.1s',
            });

            $MorphContentWrapper.css({
              'z-index': 1900,
              'opacity': 1,
              'background': '#e75854',
              'pointer-events': 'auto',
              top: '50%',
              left: '50%',
              'margin': '-' + ( ContentDimensions.height / 2 ) + 'px 0 0 -' + ( ContentDimensions.width / 2 ) + 'px',
              '-webkit-transition': 'width 0.4s 0.1s, height 0.4s 0.1s, top 0.4s 0.1s, left 0.4s 0.1s, margin 0.4s 0.1s',
              'transition': 'width 0.4s 0.1s, height 0.4s 0.1s, top 0.4s 0.1s, left 0.4s 0.1s, margin 0.4s 0.1s'
            });
            console.log('-' + ( ContentDimensions.height / 2 ) + 'px 0 0 -' + ( ContentDimensions.width / 2 ) + 'px');

            $MorphContent.css({
              'transition': 'opacity 0.3s 0.4s ease',
              'visibility': 'visible',
              'opacity': '1'
            });

          }, 25);
        };

        var removeMorphedStyles = function () {
          $MorphContentWrapper.css(MorphContentStyle);

          $MorphContent.css({
            'transition': 'opacity 0.3s 0.3s ease',
            '-webkit-transition': 'opacity 0.3s 0.3s ease',
            'height': '0',
            'opacity': '0',
          });

          // setting visibility hidden in the above css() call results in the content being hidden too soon
          setTimeout( function () {
            $MorphContent.css('visibility', 'hidden');
          }, 100);

          $Morphable.css({
            'z-index': '1000',
            'opacity': 1,
            '-webkit-transition': 'opacity 0.1s 0.5s',
            'transition': 'opacity 0.1s 0.5s'
          });
        };


        $Morphable.bind('click', function () {
          if ( !isMorphed ) {
            addMorphedStyles();
          } else {
            removeMorphedStyles();
          }

          isMorphed = !isMorphed;
        });

        // bind close button if there is one set
        if ( scope.settings.closingEl ) {
          var ClosingElement = MorphContentWrapper.querySelector(scope.settings.closingEl);
          var $ClosingElement = angular.element(ClosingElement);

          $ClosingElement.bind('click', function () {
            if ( isMorphed ) {
              removeMorphedStyles();
              
              isMorphed = !isMorphed;
            } else {
              return;
            }
          });
        }
      });

    }
  };
}])
.directive('morphContent', ['$compile', function ($compile) {
  return {
    restrict: 'E',
    template: '<div></div>',
    replace: true,
    link: function (scope, element, attrs) {
      var content = $compile(attrs.template)(scope);
      content.css({
        'visibility': 'hidden',
        'opacity': '0',
        '-webkit-transition': 'opacity 0.1s, visibility 0s 0.1s, height 0s 0.1s',
        'transition': 'opacity 0.1s, visibility 0s 0.1s, height 0s 0.1s'
      });

      element.append(content);

    }
  }; 
}]);