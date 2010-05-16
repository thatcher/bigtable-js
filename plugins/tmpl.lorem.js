/**
 * jQuery Lorem Ipsum 0.1.0
 *
 * Copyright (c) 2008-2009 Chris Thatcher (claypooljs.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 *  Ported with love (and little change or effort) from the
 *  Django Python Application Framework (djangoproject.com)
 *
 *  """
 *  Utility functions for generating "lorem ipsum" Latin text.
 *  """
 */
(function($){

    var COMMON_P = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
    var WORDS = ['exercitationem', 'perferendis', 'perspiciatis', 'laborum', 'eveniet', 'sunt', 'iure', 'nam', 'nobis', 'eum', 'cum', 'officiis', 'excepturi', 'odio', 'consectetur', 'quasi', 'aut', 'quisquam', 'vel', 'eligendi', 'itaque', 'non', 'odit', 'tempore', 'quaerat', 'dignissimos', 'facilis', 'neque', 'nihil', 'expedita', 'vitae', 'vero', 'ipsum', 'nisi', 'animi', 'cumque', 'pariatur', 'velit', 'modi', 'natus', 'iusto', 'eaque', 'sequi', 'illo', 'sed', 'ex', 'et', 'voluptatibus', 'tempora', 'veritatis', 'ratione', 'assumenda', 'incidunt', 'nostrum', 'placeat', 'aliquid', 'fuga', 'provident', 'praesentium', 'rem', 'necessitatibus', 'suscipit', 'adipisci', 'quidem', 'possimus', 'voluptas', 'debitis', 'sint', 'accusantium', 'unde', 'sapiente', 'voluptate', 'qui', 'aspernatur', 'laudantium', 'soluta', 'amet', 'quo', 'aliquam', 'saepe', 'culpa', 'libero', 'ipsa', 'dicta', 'reiciendis', 'nesciunt', 'doloribus', 'autem', 'impedit', 'minima', 'maiores', 'repudiandae', 'ipsam', 'obcaecati', 'ullam', 'enim', 'totam', 'delectus', 'ducimus', 'quis', 'voluptates', 'dolores', 'molestiae', 'harum', 'dolorem', 'quia', 'voluptatem', 'molestias', 'magni', 'distinctio', 'omnis', 'illum', 'dolorum', 'voluptatum', 'ea', 'quas', 'quam', 'corporis', 'quae', 'blanditiis', 'atque', 'deserunt', 'laboriosam', 'earum', 'consequuntur', 'hic', 'cupiditate', 'quibusdam', 'accusamus', 'ut', 'rerum', 'error', 'minus', 'eius', 'ab', 'ad', 'nemo', 'fugit', 'officia', 'at', 'in', 'id', 'quos', 'reprehenderit', 'numquam', 'iste', 'fugiat', 'sit', 'inventore', 'beatae', 'repellendus', 'magnam', 'recusandae', 'quod', 'explicabo', 'doloremque', 'aperiam', 'consequatur', 'asperiores', 'commodi', 'optio', 'dolor', 'labore', 'temporibus', 'repellat', 'veniam', 'architecto', 'est', 'esse', 'mollitia', 'nulla', 'a', 'similique', 'eos', 'alias', 'dolore', 'tenetur', 'deleniti', 'porro', 'facere', 'maxime', 'corrupti'];
    var COMMON_WORDS = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipisicing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
    
    //static functions
    $.extend({

        /**
         * Returns a string of `count` lorem ipsum words separated by a single 
         * space. If `common` is True, then the first 19 words will be the standard
         * 'lorem ipsum' words. Otherwise, all words will be selected randomly.
         * @param {Object} count
         * @param {Object} common
         */
        words: function(count, common){
            /**
             */
            common = !!common ? true : false;
            var word_list;
            word_list = common ? COMMON_WORDS : [];
            
            var c = word_list.length;
            if (count > c) {
                word_list = word_list.concat(randomSample(WORDS, count - c));
            }else {
                word_list = word_list.slice(0, count);
            }
            return word_list;
        },
        
        /**
         * a convience function to upper case the resulting words
         * @param {Object} count
         * @param {Object} common
         */
        title: function(count, common){
            var title = [], words = $.words(count, common);
            $.each(words, function(pos, word){
                title.push(word.charAt(0).toUpperCase() + word.slice(1));
            });
            return title.join(' ');
        },
       
        /**
         * Returns a randomly generated sentence of lorem ipsum text.
         * The first word is capitalized, and the sentence ends in either a 
         * period or question mark. Commas are added at random.
         * @param {Object} common
         */
        sentence: function(common){
            // Determine the number of comma-separated sections and number of 
            // words in each section for this sentence.
            common = !!common ? true : false;
            var sections = [], range = randomNumber(8, 15);
            sections = $.words(range, common);
            for (var i = 0; i < sections.length - 1; i++) {
                if (Math.random() < 0.15) {
                    sections[i] += ',';
                }
            }
            var s = sections.join(' ');
            // Convert to sentence case and add end punctuation.
            return (s.charAt(0).toUpperCase() + s.slice(1) + '.');
        },
        
        /**
         * Returns a randomly generated paragraph of lorem ipsum text.
         * The paragraph consists of between 3 and 6 sentences, inclusive.
         * @param {Object} common
         */
        paragraph: function(common){
            common = !!common ? true : false;
            var paragraph = [], range = randomNumber(3, 6), i;
            if (common) {
                paragraph.push(COMMON_P);
            } else {
                for (i = 0; i < range; i++) {
                    paragraph.push($.sentence());
                }
            }
            return paragraph.join(' ');
        },
        
        /**
         * 
         * Returns a list of paragraphs as returned by paragraph().
         * If `common` is true, then the first paragraph will be the standard
         * 'lorem ipsum' paragraph. Otherwise, the first paragraph will be random
         * Latin text. Either way, subsequent paragraphs will be random Latin text.
         * @param {Object} count
         * @param {Object} common
         */
        paragraphs: function(count, common){
            common = common ? true : false;
            var paras = [];
            for (var i = 0; i < count; i++) {
                if (common && i == 0) 
                    paras = paras.concat(COMMON_P);
                else 
                    paras = paras.concat($.paragraph());
            }
            return paras;
        }
    });
    
    //element functions
    $.fn.extend({
        /**
         * See jQuery.words
         */
        words : function(){
            var args = arguments;
            this.each(function(){
                this.text($.words.apply($, args));
            });
        },
        
        /**
         * See jQuery.title
         */
        title: function(){
            var args = arguments;
            this.each(function(){
                this.text($.title.apply($, args));
            });
        },
        
        /**
         * See jQuery.sentence
         */
        sentence: function(){
            var args = arguments;
            this.each(function(){
                this.text($.sentence.apply($, args));
            });
        },
        
        /**
         * See jQuery.paragraph
         */
        paragraph: function(){
            var args = arguments;
            this.each(function(){
                this.text($.paragraph.apply($, args));
            });
        },
        
        /**
         * See jQuery.paragraphs
         */
        paragraphs: function(){
            var args = arguments;
            this.each(function(){
                this.text($.paragraphs.apply($, args));
            });
        }
    });
    
    
    //template tags    
    jQuery.extend(jQuery.tmpl.tags, {
        
        /**
         * {{words(n)}}
         */
        words:  {
            _default: [ null, null ],
            prefix: "\n\
        T.push( $.words($2) );"
        },
        
        /**
         * {{title(n)}}
         */
        title:  {
            _default: [ null, null ],
            prefix: "\n\
        T.push( $.title($2) );"
        },
        
        /**
         * {{sentence(n)}}
         */
        sentence:  {
            _default: [ null, null ],
            prefix: "\n\
        T.push( $.sentence($2) );"
        },
        
        /**
         * {{paragraph(n)}}
         */
        paragraph:  {
            _default: [ null, null ],
            prefix: "\n\
        T.push( $.paragraph($2) );"
        },
        
        /**
         * {{paragraphs(n)}}
         */
        paragraphs:  {
            _default: [ null, null ],
            prefix: "\n\
        T.push( $.paragraphs($2) );"
        }
        
        
    });
    
    
    var randomSample = function(array, count){
        var i, randomArray = [];
        for (i = 0; i < count; i++) {
            randomArray.push(array[randomNumber(0, array.length)]);
        }
        return randomArray;
    };
    
    var randomNumber = function(startRange, endRange){
        var range = endRange - startRange, randomNumber = endRange - Math.ceil(Math.random() * range);
        return randomNumber;
    };
    
    var randomLetter = function(letters){
        return letters.charAt(randomNumber(0, letters.length - 1));
    };
})(jQuery);
