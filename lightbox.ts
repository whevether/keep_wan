///<reference path="jquery.d.ts"/>
module pluginNamespace {
// 这是一个图片预览功能插件.........  使用typescript 编写.   日期2016-05-17    编写者:keep_wan
//本人是个菜鸟.  请大神不要笑话;欢迎一起交流typescrip   
    export class Plugin
    {
        //插件名字
        public static NAME: string = 'pluginTest';

        // private _el: HTMLElement;
        // private _$el: JQuery;
        // private _settings: any;
        private album :any[];
        private currentImageIndex:number;
        private options :any;
        //dom节点
        private lightbox:any;
        private overlay:any;
        private outerContainer:any;
        private container:any;
        
        // 设定图像padding值
        private containerTopPadding :any;
        private containerRightPadding:any;
        private containerBottomPadding:any;
        private containerLeftPadding:any;
        constructor(options?: any)
        {

            // this._el = elm;
            // this._$el = $(element);
            this.album = [];
           
            this.currentImageIndex = 0;
            //合并默认参数
            this.options = $.extend(this,Plugin.default);
            this.option(options); //合并用户定义参数  
            // console.log(this.options);    
          
           
            //初始化
            this.init();
            
            
        }
        
        // 默认设置
       public static default = { 
           albumLabel: 'Image %1 of %2', //查看图像时设置的下方字母显示的文本,默认的文本显示当前图像数目和在该组图像的总数
           alwaysShowNavOnTouchDevices: false,//如果为true将永远支持触摸导航.导航一直可见
           fadeDuration: 500, //显示图片时间
           fitImagesInViewport: true, //如果为真,调整使其整齐的在它内部对齐.扩张了视区以外的图像,不必用户滚动查看这个图像
           // maxWidth: 800, //设置图片最大宽度.如果设置了就不能自适应图像
           // maxHeight: 600, //设置图像高度.如果设置了就不能自适应图像
           positionFromTop: 50, //图像从视口顶部便宜量
           resizeDuration: 700, //转换图片大小时所用时间
           showImageNumberLabel: true, //显示图片数量标签
           wrapAround: false, //如果为真.当用户到达最后一张图片时.右箭头出现,滚回第一张图片
           disableScrolling: false//为真时禁用滚动
        };  
        
        //合并用户定义参数
        private option(options:any):void
        {
             $.extend(this.options,options);
        }
        
        // 图像数量标签
        private imageCountLabel(currentNumber:number,totalImages:number):number
        {
            // 返回当前和图像总数.用正则表达式替换默认参数的标签
            return this.options.albumLabel.replace(/%1/g,currentNumber).replace(/%2/g,totalImages);
        }
        //初始化方法
        private init() : void
        {
            // 启用方法
            this.enable();
           
            //建立
            this.build();
       
          
        }
        //通过标签a,绑定标签属性数据来启用图片预览功能
        private enable():void
        {
            var self = this;
            // 绑定点击事件,并过滤一些属性
            $('body').on('click', 'a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]',(evt:JQueryEventObject)=>{
                 //调用开始图片预览方法
                 self.start($(evt.currentTarget));             
                 return false;
            });
        }
        //建立图片容器  
        private build():void
        {
            var self = this;   //类对象本身
             //图像预览容器节点
              $('<div id="lightboxOverlay" class="lightboxOverlay"></div><div id="lightbox" class="lightbox"><div class="lb-outerContainer"><div class="lb-container"><img class="lb-image" src="" /><div class="lb-nav"><a class="lb-prev" href="" ></a><a class="lb-next" href="" ></a></div><div class="lb-loader"><a class="lb-cancel"></a></div></div></div><div class="lb-dataContainer"><div class="lb-data"><div class="lb-details"><span class="lb-caption"></span><span class="lb-number"></span></div><div class="lb-closeContainer"><a class="lb-close"></a></div></div></div></div>').appendTo($('body'));
              /*需要特别注意的这些this.获取dom节点不能放在构造函数内.  不然无法起作用. 本人就犯了错.把这些放在构造函数内了.所以this.其实是先调用构造函数的变量.这样就比这个方法内优先级高了 */
            //    获取对应预览图像的节点
            this.lightbox = $("#lightbox");
            this.overlay = $("#lightboxOverlay");
            this.outerContainer = this.lightbox.find(".lb-outerContainer");
            this.container = this.lightbox.find(".lb-container");
            //  为查找到的值设置css padding 值
            this.containerTopPadding = parseInt(this.container.css("padding-top"),10);
            this.containerRightPadding = parseInt(this.container.css("padding-right"),10);
            this.containerBottomPadding = parseInt(this.container.css("padding-bottom"),10);
            this.containerLeftPadding = parseInt(this.container.css("padding-left"),10);  
        
            //事件处理程序.  点击图片外的dom隐藏元素
            this.overlay.hide().on("click",()=>{
               self.end();
               return false; 
            });
            this.lightbox.hide();
            this.lightbox.hide().on("click",(evt:JQueryEventObject)=>{
            //   判断目标容器的id 是否为lightbox ,是就结束预览
               if($(evt.target).attr("id") === "lightbox")
               {
                   self.end();
               } 
               return false;
            });
            // 点击图片上的左右键切换图片
            this.lightbox.find(".lb-prev").on("click",()=>{
               //判当前图片索引位置
               if(self.currentImageIndex === 0)
               {
                   self.changeImage(self.album.length -1); //图片数组的值减1,到改变图片显示方法
               } else
               {
                  //否则挡墙图片索引减1
                  self.changeImage(self.currentImageIndex -1); 
               }
               return false;
            });
            this.lightbox.find(".lb-next").on("click",()=>{
               //判断当前图片索引是否为图片数组长度
               if(self.currentImageIndex === self.album.length -1) 
               {
                   //如果当前图片索引等于图片数组长度.就改变图片显示为第一张图片
                   self.changeImage(0);
               }else
               {
                   //否则当前索引+1
                   self.changeImage(self.currentImageIndex + 1);
               }
               return false;
            });
            //点击X按钮退出图片预览
            this.lightbox.find(".lb-loader,.lb-close").on("click",()=>{
               self.end();
               return false; 
            });
        }
        
        
        //显示图片,如果图片是一组就显示一组图片
        private start(link:any):void
        {
            
            var self = this;
            // console.log(self.addToAlbum(link));
            var win_dow = $(window);
            //  图片跟随窗口放大缩小,受一个函数，然后返回一个新函数，并且这个新函数始终保持了特定的上下文语境。
            $(win_dow).on("resize",$.proxy(this.sizeOverlay,this));
            // 隐藏匹配元素
            $("select,object,embed").css({visbility:'hidden'});
            this.sizeOverlay();
            //清空图片数组
            this.album = [];
            
            //图片数量
            var imageNumber:number = 0;
            //添加到图像数组内
            var addToAlbum = (lk:any)=>{this.album.push({link:lk.attr("href"),title:lk.attr("data-title")||lk.attr("title")})};
            // function addToAlbum(lk:any)
            // {     
            //             //清空数组内容
            //     console.log(lk);    
            //    this.album.push({
            //        link:lk.attr("href"), //图片链接地址
            //         title:lk.attr('data-title') || lk.attr('title') //数据标题或者标题
            //       });
                    
            // }
            
            //获得点击图片的数据data-lightbox;
            var dataLightboxValue:any = link.attr("data-lightbox");
          
            var links:any;
            // 判断是否存在data-lightbox这个数据
            if(dataLightboxValue)
            {
                //如果为真就获取目标签名 $(link.prop("tagName")) 点击目标的第一个目标标签名
                links = $(link.prop('tagName') + '[data-lightbox="' + dataLightboxValue + '"]');
               
                //目标签名数量  //加入到图片数组
                for(var i = 0;i< links.length;i=++i)
                {   
                    // console.log(i);
                    addToAlbum($(links[i]));
                    //当图像数组内的数量登入0时,图像数量设置为图像集合内的数量
                    if(links[i] === link[0])
                    {
                        imageNumber = i;
                    }
                }
            }else
            {
                //如果不存在data-ligthbox
                if(link.attr('ref') === 'lightbox')
                {
                    //判断ref属性是否存在lightbox //存在就添加
                    addToAlbum(link);
                }else
                {
                    links = $(link.prop("tagName")+'[rel=" ' + links.attr + ' "]');
                    for(var j = 0;j<links.length;j++)
                    {
                        addToAlbum($(links[j]));
                        if(links[j] === link[0])
                        {
                            imageNumber = j;
                        }
                    }
                }
            }
            
            
            // 图片位置
            var top = win_dow.scrollTop() + this.options.positionFromTop;
            var left = win_dow.scrollLeft();
            // console.log(left);
            this.lightbox.css({
               top:top+"px",
               left:left+"px" 
            }).fadeIn(this.options.fadeDuration);
            // console.log(this.lightbox);
            // 判断是否开启了禁止滚动
            if(this.options.disableScrolling)
            {
                $("body").addClass("lb-disable-scrolling");
            }
            // 改变当前图片显示
            this.changeImage(imageNumber);
        
            
        }
        // 改变显示图片
        private changeImage(imgNumber:number):void
        {
            var self = this;
            // 禁用键盘导航
            this.disableKeyboardNav();
            //图片位置
            var image:any = this.lightbox.find(".lb-image");
            // console.log(image);
            //背景动画效果
            this.overlay.fadeIn(this.options.fadeDuration);
          
            $(".lb-loader").fadeIn(this.options.fadeDuration);
            // 加载图片时隐藏匹配元素
            // this.lightbox.find(".lb-image,.lb-nav,.lb-prev,.lb-next,.lb-dataContainer,.lb-number,.lb-caption").hide();
            this.outerContainer.addClass("animating");
           
            //图片载入
            var preloader:HTMLImageElement = new Image();  
         
            preloader.onload = ()=>{
              var pre_loader:any;
              var imageHeight:number;
              var imageWidth:number;
              var maxImageHeight:number;
              var maxImageWidth:number;
              var windowHeight:number;
              var windowWidth:number;
            
            //   载入图片路径是当前点击图片的源链接地址
              image.attr("src",self.album[imgNumber].link);
              
            //   载入图片实例
              pre_loader = $(preloader);
              image.width(preloader.width); //图片宽度
              image.height(preloader.height);//图片高度
              //如果为真就在合适位置显示
              if(self.options.fitImagesInViewport)
              {
                  windowWidth = $(window).width();
                  windowHeight = $(window).height();
                  maxImageWidth = windowWidth - self.containerLeftPadding - self.containerRightPadding -20;
                  maxImageHeight = windowHeight - self.containerTopPadding - self.containerBottomPadding - 20;
                  //检查图片的最大值
                  if(self.options.maxWidth && self.options.maxWidth < maxImageWidth)
                  {
                      maxImageWidth = self.options.maxWidth;
                  } 
                  if(self.options.maxHeight && self.options.maxHeight < maxImageHeight)
                  {
                      maxImageHeight = self.options.maxHeight;
                  }
                  
                //   尺寸是否合适
                  if((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight))
                  {
                      //判断图片的宽度除以图片所占的最大宽度是否大于 同样除以的高度
                      if((preloader.width/maxImageWidth) > (preloader.height /maxImageHeight))
                      {
                            imageWidth = maxImageWidth;
                            imageHeight = (preloader.height / (preloader.width / imageWidth), 10); 
                            //设置图片宽度和高度
                            image.width(imageWidth);  
                            image.height(imageHeight);
                            
                      }else
                      {
                          imageHeight = maxImageHeight;
                          imageWidth = (preloader.width/(preloader.height/imageHeight));
                          //图片高度和宽度
                          image.width(imageWidth);
                          image.height(imageHeight);
                      }
                  }
              }
                // 尺寸容器k
                self.sizeContainer(image.width(),image.height());
            };
            
            //图片目标
            preloader.src = this.album[imgNumber].link;
            this.currentImageIndex = imgNumber; //设置当前图片索引为正在显示的  
        }
        
        // 尺寸容器
        private sizeContainer(imgWidth:number,imgHeight:number):void
        {
            var self = this;
            //边框宽度/高度
            var oldWidth:number = this.outerContainer.outerWidth();
            var oldHeight:number = this.outerContainer.outerHeight();
            // 图像宽度/高度 +padding
            var newWidth:number = imgWidth + this.containerLeftPadding + this.containerRightPadding;
            var newHeight:number = imgHeight + this.containerBottomPadding + this.containerTopPadding;
            //定位显示文字和按钮位置
            function posResize()
            {
                //设置文字容器的大小
                self.lightbox.find(".lb-dataContainer").width(newWidth);
                //设置导航高度
                self.lightbox.find(".lb-prev").height(newHeight);
                self.lightbox.find(".lb-next").height(newHeight);
                //调用显示图片
                self.showImage();
            }
            //判断容器的宽度/高度是否不等于图片的宽度/高度
            if(oldWidth !== newWidth || oldHeight !== newHeight)
            {
                //如果不等于就显示容器动画的宽度高度和显示文字
                this.outerContainer.animate({
                    width:newWidth,
                    height:newHeight
                },this.options.resizeDuration,"swing",()=>{
                    posResize();
                });
            }else
            {
                posResize();
            }
            
        }
        
        //显示图像和细节.并开始预加载邻居图像
        private showImage():void
        {
            //隐藏加载动画
            this.lightbox.find(".lb-loader").stop(true).hide();
            //显示图像
            this.lightbox.find('.lb-image').fadeIn("slow");
            //更新导航.
            this.updateNav();
            //更形内容说明区域
            this.updateDetails();
            //预加载相邻图片
            this.preloadNeighboringImages();
            //启用键盘导航
        }
       //更新导航
       private updateNav():void
       {
           //检查浏览器是否支持触摸操作
           var alwaysShowNav:boolean = false;
           try
           {
               document.createEvent("TouchEvent");//创建触摸事件
               alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices)?true:false; //判断默认设置是否为true,
           }catch(e){}
           //显示导航
           this.lightbox.find('.lb-nav').show();
           //集合内的图片是否不为空
           if(this.album.length > 1)
           {
               //如果支持触摸就始终显示导航
               if(this.options.wrapAround)
               {
                   if(alwaysShowNav)
                   {
                       this.lightbox.find(".lb-prev,.lb-next").css({"opacity":"1"});
                       
                   }
                   this.lightbox.find(".lb-prev,.lb-next").show();
               }
           }else
           {
               //,在判断当前图片索引是否大于0 大于就显示左导航
               if(this.currentImageIndex>0)
               {
                   this.lightbox.finf(".lb-prev").show();
                   //支持触摸,就显示左导航
                   if(alwaysShowNav)
                   {
                       this.lightbox.find(".lb-prev").css({"opacity":"1"});
                   }
               }
               //如果当前图片索引小于图片集合就显示右导航
               if(this.currentImageIndex < this.album.length -1)
               {
                   this.lightbox.find(".lb-next").show();
                   //是否支持触摸屏
                   if(alwaysShowNav)
                   {
                       this.lightbox.find(".lb-next").css({"opacity":"1"});
                   }
               }
           }
           
       }
       //更新内容说明区域
       private updateDetails():void
       {
           var self = this;
        
           //定位内容描点
           if(typeof self.album[self.currentImageIndex].title !== undefined && self.album[self.currentImageIndex].title !== "")
           {
               self.lightbox.find(".lb-caption")
               .html(self.album[self.currentImageIndex].title)
               .fadeIn("fast")
               .find("a").on("click",(evt:JQueryEventObject)=>{
                    if($(evt).attr("target") !== undefined)
                    {
                        window.open($(evt).attr("href"),$(evt).attr("target"));
                    }else
                    {
                        location.href = $(evt).attr("href");
                    }
               });
               
           }
           
           //当图片数量大于1时显示数量标题
           if(self.album.length > 1 && self.options.showImageNumberLabel)
           {
               var labelText = self.imageCountLabel(self.currentImageIndex +1,self.album.length);
               self.lightbox.find(".lb-number").text(labelText).fadeIn();
               
           }else
           {
               self.lightbox.find(".lb-number").hide();// 否则隐藏数量
           }
           self.outerContainer.removeClass("animating");//移除样式类
           //内容显示动画  
           self.lightbox.find(".lb-dataContainer").fadeIn(self.options.resizeDuration,()=>{
               return self.sizeOverlay();
           });
           
       }
       //预加载相邻图片
       private preloadNeighboringImages():void
       {
            
            if(this.album.length > this.currentImageIndex +1)
            {
                var preloadNext:HTMLImageElement = new Image();
                preloadNext.src = this.album[this.currentImageIndex +1].link;
            }
            if(this.currentImageIndex >0)
            {
                var preloadPrev:HTMLImageElement = new Image();
                preloadPrev.src = this.album[this.currentImageIndex -1].link;
            }
       }
        // 拉伸以覆盖.以适应视图
        private sizeOverlay():void
        {           
            this.overlay.width($(document).width()).height($(document).height());
        }
        //    启用键盘导航
        private enableKeyboardNav():void
        {
            $(document).on('keyup.keyboard',$.proxy(this.keyboardAction,this));
        }
        //禁用键盘导航
        private disableKeyboardNav():void
        {
            $(document).off(".keyboard");//移除键盘事件
        }
        //键盘激活
        private keyboardAction(evt:JQueryEventObject):void
        {
            //键盘操作代码
            var KEYCODE_ESC = 27;
            var KEYCODE_LEFTARROW = 37;
            var KEYCODE_RIGHTARROW = 39;
            //键盘事件
            var keycode = evt.keyCode;
            var key = String.fromCharCode(keycode).toLowerCase();//所有按键转换为小写
            //判断按的是什么键
            if(keycode === KEYCODE_ESC || key.match(/x|o|c/))
            {
                this.end();//退出
            }else if(key === 'p' || keycode === KEYCODE_LEFTARROW)
            {
                //判断按键是否为p或者往左
                if(this.currentImageIndex !== 0)
                {
                    this.changeImage(this.currentImageIndex -1);
                }else if(this.options.wrapAround && this.album.length > 1)
                {
                    //判断是否支持触摸屏
                    this.changeImage(this.album.length -1);
                }
            }else if(key === 'n' || keycode === KEYCODE_RIGHTARROW)
            {
                //判断按钮是否为n 或者右键 并且不等于当前图片集合长度
                if(this.currentImageIndex !== this.album.length -1)
                {
                    this.changeImage(this.currentImageIndex +1);
                }else if(this.options.wrapAround && this.album.length > 1)
                {
                    this.changeImage(0);
                }
            }
        }
        
        //结束图片预览
        private end():void
        {
             this.disableKeyboardNav(); //禁用键盘导航
            $(window).off('resize', this.sizeOverlay); //移除窗体缩放事件
            this.lightbox.fadeOut(this.options.fadeDuration); //通过淡出的方式隐藏匹配元素。+时间
            this.overlay.fadeOut(this.options.fadeDuration);  //通过淡出的方式隐藏匹配的元素  + 设定时间
            $('select, object, embed').css({
                visibility: 'visible' //把媒体部分设为可见
            });
            // 判断是否已经禁用滚动   .如果是就移除禁用滚动样式类
            if (this.options.disableScrolling) {
                $('body').removeClass('lb-disable-scrolling');
            }
        }
        
    }
}
(function($: JQueryStatic, window: any, document: any) {
    
    /*第一种插件调用方法.  这里的name是个静态插件名字字段       通过$("#select").pluginTest();  //这个pluginTest自己编写插件的时候可以修改自定义  不会影响全局 */
    // $.fn[pluginNamespace.Plugin.NAME] = function(options:any) { 
    
        // return this.each(()=> {
                            
            // new pluginNamespace.Plugin(options);
            // console.log(new pluginNamespace.Plugin(options));
        // });

    // };
    
    /* 第二种调用插件方法.   通过构造方法调用.   在html页面的标签里写上data-lightbox 就可以使用了   这个方法需要你编写插件的时候绑定data-lightbox 这个数据,名称可以自己定义过 */
    $(new Function('var g = new pluginNamespace.Plugin(this)'));


})(jQuery, window, document);
