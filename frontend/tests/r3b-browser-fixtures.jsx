// Real React components and isolated HTTP fixtures; server security is tested by scripts/r3b/probes.mjs.
export async function testR3BPages() {
  const [{default:React},client,router,{AuthContext,AuthProvider},{default:Manager},{default:Admin},{default:Support},{default:Payment},{default:Booking},{default:Reviews},{default:Complaints},{default:AccessErrorHandler}] = await Promise.all([
    import('react'),import('react-dom/client'),import('react-router-dom'),import('/src/context/AuthContext.jsx'),import('/src/pages/ManagerPortal.jsx'),import('/src/pages/AdminPortal.jsx'),import('/src/pages/SupportPortal.jsx'),import('/src/pages/PaymentPage.jsx'),import('/src/pages/BookingPreparation.jsx'),import('/src/components/MovieReviews.jsx'),import('/src/pages/Complaints.jsx'),import('/src/components/AccessErrorHandler.jsx'),
  ]);
  const {authTokenStorage}=await import('/src/api/authToken.js');
  const {default:AreaLayout}=await import('/src/layouts/AreaLayout.jsx');
  const {flushSync}=await import('react-dom');
  const {createRoot}=client.default??client;const container=document.createElement('div');document.body.append(container);
  const root=createRoot(container),oldFetch=window.fetch,oldToken=authTokenStorage.get();const results=[],calls=[];
  const actor=(role,codes)=>({role,permissions:codes.map(code=>({code}))});
  let renderId=0;
  const render=(user,element,route='/')=>flushSync(()=>root.render(React.createElement(AuthContext.Provider,{key:++renderId,value:{user}},React.createElement(router.MemoryRouter,{initialEntries:[route]},element))));
  const wait=async condition=>{const end=Date.now()+10000;while(!condition()){if(Date.now()>end)throw Error('R3B browser timeout: '+container.innerText);await new Promise(r=>setTimeout(r,25));}};
  const button=text=>[...container.querySelectorAll('button')].find(b=>b.textContent===text);
  const check=(name,condition)=>{if(!condition)throw Error(name);results.push({name,status:'PASS'});};
  let liveUser,forceForbidden=false,forceScopeForbidden=false;
  const order={id:1,showtimeId:1,status:'Chờ thanh toán',holdExpiresAt:new Date(Date.now()+60000).toISOString(),movieTitle:'R3B film',cinemaName:'Fixture',total:120000,payments:[]};
  const complaint={id:1,title:'RBAC fixture',senderName:'Customer',type:'Hỗ trợ',status:'Mới',content:'Fixture content',processings:[]};
  window.fetch=async(url,opts={})=>{
    const route=new URL(url,location.href).pathname;calls.push({route,method:opts.method??'GET'});
    if(forceForbidden&&route==='/api/admin/cinemas/1/images')return new Response(JSON.stringify({error:{code:'FORBIDDEN',message:'Permission revoked'}}),{status:403});
    if(forceScopeForbidden&&route==='/api/manager/cinemas/1/rooms')return new Response(JSON.stringify({error:{code:'FORBIDDEN',message:'Assignment revoked'}}),{status:403});
    let data={};
    if(route==='/api/auth/me')data={user:liveUser};
    else if(route==='/api/manager/cinemas')data={cinemas:liveUser?.role==='QUAN_LY_RAP'&&liveUser.cinemaAssignments?.length===0?[]:[{id:1,name:'Fixture',city:'Test'}]};
    else if(route==='/api/admin/cinemas')data={cinemas:[{RapID:1,TenRap:'Fixture'}]};
    else if(route.startsWith('/api/admin/cinemas/'))data={images:[{HinhAnhRapID:1,URL:'/favicon.svg',TrangThai:'Hoạt động'}]};
    else if(route.startsWith('/api/admin/permissions'))data={permissions:[{QuyenID:1,MaQuyen:'QL_QUYEN'}]};
    else if(route==='/api/admin/users')data={users:[]};
    else if(route==='/api/admin/reports/revenue')data={cinemas:[],totals:{}};
    else if(route==='/api/admin/dashboard')data={dashboard:{TongRap:1}};
    else if(route.endsWith('/rooms'))data={rooms:[{id:1,name:'Fixture room'}]};
    else if(route.endsWith('/showtimes'))data={showtimes:[]};
    else if(route.endsWith('/pricing'))data={pricing:[]};
    else if(route.endsWith('/dashboard'))data={dashboard:{}};
    else if(route.endsWith('/revenue'))data={revenue:[]};
    else if(route==='/api/support/complaints'||route==='/api/admin/complaints')data={complaints:[complaint]};
    else if(route.endsWith('/complaints/1'))data={complaint};
    else if(route.endsWith('/order-reference'))data={order:{DonDatVeID:1,TrangThai:'Đã thanh toán'}};
    else if(route==='/api/orders/1')data={order};
    else if(route==='/api/orders')data={orders:[]};
    else if(route==='/api/complaints')data={complaints:[]};
    else if(route==='/api/showtimes/1')data={showtime:{id:1,movieId:1,movieTitle:'Fixture film'}};
    else if(route.endsWith('/seats'))data={seats:[{id:1,roomId:1,row:'A',number:1,label:'A1',price:120000,status:'Trống'}]};
    else if(route==='/api/products')data={products:[]};
    else if(route.endsWith('/reviews'))data={reviews:[]};
    return new Response(JSON.stringify(data),{status:200});
  };
  const pageRoute=(path,element)=>React.createElement(router.Routes,null,React.createElement(router.Route,{path,element}));
  try {
    for(const [permission,expected,absent] of [['QL_GHE','Tải ghế','Tạo phòng'],['QL_SUAT_CHIEU','Tạo suất','Tạo phòng'],['XEM_BAO_CAO_RAP',null,'Tạo phòng']]){
      calls.length=0;render(actor('QUAN_LY_RAP',[permission]),React.createElement(Manager));
      await wait(()=>container.textContent.includes('Manager Portal')&&!container.textContent.includes('Đang tải dữ liệu quản lý'));
      if(expected)await wait(()=>button(expected));else await wait(()=>container.textContent.includes('Doanh thu'));
      check('Manager partial '+permission,(!expected||Boolean(button(expected)))&&!button(absent));
      const forbiddenReads=permission==='QL_GHE'?['rooms','showtimes','pricing','dashboard','revenue']:permission==='QL_SUAT_CHIEU'?['rooms','pricing','dashboard','revenue']:['rooms','showtimes','pricing'];
      check('Manager skips unauthorized reads '+permission,!calls.some(c=>forbiddenReads.some(part=>c.route.endsWith('/'+part))));
      if(permission==='QL_GHE'){const input=container.querySelector('[aria-label="Mã phòng xem ghế"]');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(input,'1');input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,30));button('Tải ghế').click();await wait(()=>button('Tạo ghế'));check('seat-only workflow without QL_PHONG',calls.some(c=>c.route==='/api/manager/rooms/1/seats'));}
    }
    for(const [permission,present,absent,route] of [['XEM_BAO_CAO_TOANHE','Doanh thu','Tài khoản','/api/admin/dashboard'],['QL_NGUOIDUNG','Tài khoản','Doanh thu','/api/admin/users'],['QL_QUYEN','Lưu quyền vai trò','Tài khoản','/api/admin/permissions']]){
      calls.length=0;render(actor('ADMIN',[permission]),React.createElement(Admin));await wait(()=>calls.some(c=>c.route===route)&&!container.textContent.includes('Đang tải dữ liệu'));
      await wait(()=>button(present));
      check('Admin partial '+permission,Boolean(button(present))&&!button(absent));check('Admin skips unauthorized default dashboard '+permission,permission==='XEM_BAO_CAO_TOANHE'||!calls.some(c=>c.route==='/api/admin/dashboard'));
    }
    for(const codes of [['QL_KHIEUNAI'],['QL_KHIEUNAI','XULY_KHIEUNAI'],['QL_KHIEUNAI','TRA_CUU_DON']]){
      calls.length=0;render(actor('CSKH',codes),React.createElement(Support));await wait(()=>container.textContent.includes('#1 · RBAC fixture'));
      [...container.querySelectorAll('button')].find(b=>b.textContent.includes('#1 · RBAC fixture')).click();await wait(()=>container.textContent.includes('Timeline xử lý'));
      check('Support processing controls '+codes.join('+'),Boolean(button('Ghi diễn biến'))===codes.includes('XULY_KHIEUNAI'));
      check('Support reference fetch '+codes.join('+'),calls.some(c=>c.route.endsWith('/order-reference'))===codes.includes('TRA_CUU_DON'));
    }
    render(actor('KHACH_HANG',[]),pageRoute('/orders/:orderId/payment',React.createElement(Payment)),'/orders/1/payment');await wait(()=>button('Xác nhận thanh toán'));check('Customer payment needs THANH_TOAN',button('Xác nhận thanh toán').disabled);
    render(actor('KHACH_HANG',[]),React.createElement(Complaints));await wait(()=>container.textContent.includes('Lịch sử khiếu nại'));check('Customer history survives missing GUI',!button('Gửi khiếu nại'));
    render(actor('ADMIN',['DANH_GIA']),React.createElement(Reviews,{movieId:1}));await wait(()=>container.textContent.includes('Đánh giá'));check('Review requires Customer eligibility',!button('Gửi đánh giá'));
    render(actor('ADMIN',['DAT_VE','QL_PHONG','QL_KHIEUNAI']),React.createElement(AreaLayout,{title:'Navigation',links:[{to:'/orders',label:'History',role:'KHACH_HANG'}]}));
    check('Navigation hides foreign areas despite overlapping permissions',!container.querySelector('a[href="/orders"]')&&!container.querySelector('a[href="/manager"]')&&!container.querySelector('a[href="/support"]')&&Boolean(container.querySelector('a[href="/admin"]')));
    render(actor('KHACH_HANG',[]),pageRoute('/booking/:showtimeId',React.createElement(Booking)),'/booking/1');await wait(()=>button('Đặt vé'));check('Customer booking and promotion need DAT_VE',button('Đặt vé').disabled&&button('Áp dụng').disabled);
    // Exercise the real refresh-current-user path after a 403; the rejected operation is never retried.
    liveUser=actor('ADMIN',['QL_RAP']);authTokenStorage.set('R3B_BROWSER_FIXTURE');calls.length=0;
    root.render(React.createElement(router.MemoryRouter,{key:'revocation'},React.createElement(AuthProvider,null,React.createElement(AccessErrorHandler),React.createElement(Admin))));
    await wait(()=>button('Ảnh rạp'));button('Ảnh rạp').click();
    await wait(()=>container.querySelector('[aria-label="Chọn rạp"] option[value="1"]'));
    liveUser=actor('ADMIN',[]);forceForbidden=true;
    const select=container.querySelector('[aria-label="Chọn rạp"]');select.value='1';select.dispatchEvent(new Event('change',{bubbles:true}));
    await wait(()=>container.textContent.includes('Bạn chưa được cấp quyền quản trị chức năng nào.'));
    check('403 refresh removes revoked actions without retry',calls.filter(c=>c.route==='/api/admin/cinemas/1/images').length===1&&calls.filter(c=>c.route==='/api/auth/me').length>=2);
    forceForbidden=false;liveUser={...actor('QUAN_LY_RAP',['QL_PHONG']),cinemaAssignments:[{cinemaId:1}]};calls.length=0;
    root.render(React.createElement(router.MemoryRouter,{key:'scope-revocation'},React.createElement(AuthProvider,null,React.createElement(AccessErrorHandler),React.createElement(Manager))));
    await wait(()=>button('Tạo phòng'));
    const roomName=container.querySelector('input[placeholder="Tên phòng"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(roomName,'Denied room');roomName.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,30));
    liveUser={...liveUser,cinemaAssignments:[]};forceScopeForbidden=true;button('Tạo phòng').click();
    await wait(()=>container.textContent.includes('Bạn không có phân công rạp còn hiệu lực.'));
    check('scope revoke refresh stops reads and never retries mutation',calls.filter(c=>c.route==='/api/manager/cinemas/1/rooms'&&c.method==='POST').length===1);
    return {checks:results,httpCalls:calls.length,status:'PASS'};
  }finally{root.unmount();container.remove();window.fetch=oldFetch;if(oldToken)authTokenStorage.set(oldToken);else authTokenStorage.clear();}
}
